from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Dict

from celery import Celery

from app.config import settings
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

logger = logging.getLogger(__name__)

celery_app = Celery("secureframe", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_soft_time_limit=30,
    task_time_limit=60,
    task_annotations={"*": {"rate_limit": "20/m"}},
)


@celery_app.task(bind=True, name="analyze_image_task", soft_time_limit=30, time_limit=60, rate_limit="10/m")
def analyze_image_task(self, image_data: object, filename: str) -> Dict[str, object]:
    request_id = self.request.id or "unknown"
    sandbox = SecureSandbox()
    sandbox_path = ""

    try:
        sanitized_name = sanitize_filename(filename)
        if isinstance(image_data, str):
            payload = image_data.encode("utf-8")
        else:
            payload = bytes(image_data)

        if not validate_file_size(len(payload)):
            raise ValueError("File too large")

        sandbox_path = sandbox.create_sandbox_directory()
        temp_filename = generate_secure_temp_filename(sanitized_name)
        temp_path = os.path.join(sandbox_path, temp_filename)

        with open(temp_path, "wb") as file_handle:
            file_handle.write(payload)

        if not verify_image_not_executable(temp_path):
            raise ValueError("Executable content detected")

        magic_info = sandbox.execute_in_sandbox(validate_image, temp_path, timeout=30)
        if not magic_info.get("valid"):
            raise ValueError(magic_info.get("reason", "Invalid image"))

        sandbox.execute_in_sandbox(strip_exif, temp_path, timeout=30)
        stego_result = sandbox.execute_in_sandbox(analyze_image, temp_path, timeout=30)

        audit_log(
            "task_completed",
            {"request_id": request_id, "filename": sanitized_name, "verdict": stego_result.get("verdict")},
        )

        return {
            "request_id": request_id,
            "filename": sanitized_name,
            "magic_type": magic_info.get("mime_type", "unknown"),
            "exif_stripped": True,
            "stego_score": stego_result.get("stego_score", 0.0),
            "confidence": stego_result.get("confidence", 0.0),
            "verdict": stego_result.get("verdict", "ERROR"),
            "details": stego_result.get("details", {}),
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
        }
    except Exception as exc:
        logger.exception("Celery analysis failed")
        audit_log("task_failed", {"request_id": request_id, "error": str(exc)})
        return {
            "request_id": request_id,
            "filename": filename,
            "verdict": "ERROR",
            "detail": "Task failed",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    finally:
        if sandbox_path:
            sandbox.cleanup_sandbox(sandbox_path)
