import logging
import os
import sys
import time
import uuid
from datetime import datetime
from typing import Dict

import aiofiles
import boto3
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from redis import Redis

from app.config import settings
from app.middleware.rate_limiter import limiter
from app.models.schemas import AnalysisResult, ErrorResponse, HealthResponse
from app.security import (
    audit_log,
    generate_secure_temp_filename,
    sanitize_filename,
    validate_file_size,
    verify_image_not_executable,
)
from app.services.exif_stripper import strip_exif
from app.services.magic_validator import validate_image
from app.services.sandbox import SecureSandbox
from app.services.stego_detector import analyze_image

logger = logging.getLogger("app.analysis")

router = APIRouter()


async def _save_upload_file(upload: UploadFile, destination: str, max_bytes: int) -> int:
    size = 0
    async with aiofiles.open(destination, "wb") as output:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                raise HTTPException(status_code=413, detail="File too large")
            await output.write(chunk)
    return size


def _minio_endpoint_url() -> str:
    endpoint = settings.MINIO_ENDPOINT
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        return endpoint
    return f"http://{endpoint}"


def check_dependencies() -> Dict[str, str]:
    dependencies: Dict[str, str] = {}

    try:
        redis_client = Redis.from_url(settings.REDIS_URL, socket_timeout=2)
        redis_client.ping()
        dependencies["redis"] = "ok"
    except Exception as exc:
        dependencies["redis"] = f"error: {exc.__class__.__name__}"

    try:
        s3_client = boto3.client(
            "s3",
            endpoint_url=_minio_endpoint_url(),
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name="us-east-1",
        )
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET_CLEAN)
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET_QUARANTINE)
        dependencies["minio"] = "ok"
    except Exception as exc:
        dependencies["minio"] = f"error: {exc.__class__.__name__}"

    return dependencies


@router.post(
    "/analyze",
    response_model=AnalysisResult,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
@limiter.limit("10/minute")
async def analyze_image_endpoint(request: Request, file: UploadFile = File(...)) -> AnalysisResult:
    sys.setrecursionlimit(min(1000, sys.getrecursionlimit()))

    request_id = str(uuid.uuid4())
    start_time = time.monotonic()
    sandbox = SecureSandbox()
    sandbox_path = ""
    s3_client = None

    try:
        sanitized_name = sanitize_filename(file.filename or "uploaded_file")
        audit_log("analysis_started", {"request_id": request_id, "filename": sanitized_name})

        sandbox_path = sandbox.create_sandbox_directory()
        temp_filename = generate_secure_temp_filename(sanitized_name)
        temp_path = os.path.join(sandbox_path, temp_filename)

        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        file_size = await _save_upload_file(file, temp_path, max_bytes)
        if not validate_file_size(file_size):
            raise HTTPException(status_code=413, detail="File too large")

        if not verify_image_not_executable(temp_path):
            raise HTTPException(status_code=400, detail="Executable content detected")

        magic_info = sandbox.execute_in_sandbox(validate_image, temp_path, timeout=30)
        if not magic_info.get("valid"):
            reason = magic_info.get("reason", "Invalid image")
            raise HTTPException(status_code=415, detail=reason)

        sandbox.execute_in_sandbox(strip_exif, temp_path, timeout=30)
        stego_result = sandbox.execute_in_sandbox(analyze_image, temp_path, timeout=30)

        processing_time_ms = int((time.monotonic() - start_time) * 1000)

        details = {
            "magic_description": magic_info.get("description"),
            "dimensions": magic_info.get("dimensions"),
            "pixel_count": magic_info.get("pixel_count"),
        }
        details.update(stego_result.get("details", {}))

        verdict = stego_result.get("verdict", "ERROR")

        minio_path = None
        bucket = None

        if verdict in ["CLEAN", "SUSPICIOUS", "MALICIOUS"]:
            bucket = (
                settings.MINIO_BUCKET_CLEAN
                if verdict == "CLEAN"
                else settings.MINIO_BUCKET_QUARANTINE
            )
            minio_key = f"{request_id}/{sanitized_name}"

            s3_client = boto3.client(
                "s3",
                endpoint_url=_minio_endpoint_url(),
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                region_name="us-east-1",
            )

            with open(temp_path, "rb") as f:
                s3_client.put_object(
                    Bucket=bucket,
                    Key=minio_key,
                    Body=f.read(),
                    ContentType=magic_info.get("mime_type", "application/octet-stream"),
                )

            minio_path = minio_key

        response = AnalysisResult(
            filename=sanitized_name,
            request_id=request_id,
            magic_type=magic_info.get("mime_type", "unknown"),
            exif_stripped=True,
            stego_score=stego_result.get("stego_score", 0.0),
            confidence=stego_result.get("confidence", 0.0),
            verdict=verdict,
            details=details,
            analyzed_at=datetime.utcnow(),
            processing_time_ms=processing_time_ms,
            minio_path=minio_path,
            bucket=bucket,
        )

        audit_log(
            "analysis_completed",
            {
                "request_id": request_id,
                "filename": sanitized_name,
                "verdict": response.verdict,
                "processing_time_ms": processing_time_ms,
                "bucket": bucket,
            },
        )

        return response
    except HTTPException:
        audit_log("analysis_failed", {"request_id": request_id, "reason": "http_exception"})
        raise
    except TimeoutError:
        audit_log("analysis_timeout", {"request_id": request_id})
        raise HTTPException(status_code=504, detail="Processing timeout")
    except Exception as exc:
        logger.exception("analysis_failed", extra={"request_id": request_id})
        audit_log(
            "analysis_error",
            {
                "request_id": request_id,
                "error": exc.__class__.__name__,
            },
        )
        raise HTTPException(status_code=500, detail="Internal error")
    finally:
        if sandbox_path:
            sandbox.cleanup_sandbox(sandbox_path)
        await file.close()


@router.get("/health", response_model=HealthResponse)
def api_health() -> HealthResponse:
    dependencies = check_dependencies()
    status = "healthy" if all(value == "ok" for value in dependencies.values()) else "degraded"
    return HealthResponse(status=status, version="1.0.0", dependencies=dependencies)
