import logging
import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.auth import get_current_user

logger = logging.getLogger("app.quarantine")

router = APIRouter(prefix="/quarantine", tags=["Quarantine"])

def _minio_endpoint_url() -> str:
    endpoint = settings.MINIO_ENDPOINT
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        return endpoint
    return f"http://{endpoint}"

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=_minio_endpoint_url(),
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        region_name="us-east-1",
    )

def get_public_s3_client():
    # Usamos localhost para que las URLs firmadas funcionen en el navegador web
    endpoint = _minio_endpoint_url()
    if "minio:" in endpoint:
        endpoint = endpoint.replace("minio:", "localhost:")
    
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        region_name="us-east-1",
    )

class QuarantineActionRequest(BaseModel):
    minio_path: str

@router.get("/presigned-url")
def get_presigned_url(
    path: str = Query(..., description="MinIO path of the quarantined image"),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")

    s3_client = get_public_s3_client()
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.MINIO_BUCKET_QUARANTINE,
                "Key": path,
            },
            ExpiresIn=300
        )
            
        return {"url": url}
    except Exception as e:
        logger.error(f"Error generating presigned url: {e}")
        raise HTTPException(status_code=500, detail="Error generating url")

@router.post("/approve")
def approve_image(
    request: QuarantineActionRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    s3_client = get_s3_client()
    path = request.minio_path
    
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        # Copy to clean bucket
        copy_source = {'Bucket': settings.MINIO_BUCKET_QUARANTINE, 'Key': path}
        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=settings.MINIO_BUCKET_CLEAN,
            Key=path
        )
        # Delete from quarantine
        s3_client.delete_object(
            Bucket=settings.MINIO_BUCKET_QUARANTINE,
            Key=path
        )
        return {"status": "success", "message": "Image approved and moved to clean bucket"}
    except ClientError as e:
        logger.error(f"S3 Error approving image {path}: {e}")
        raise HTTPException(status_code=500, detail="Storage error during approval")
    except Exception as e:
        logger.error(f"Error approving image {path}: {e}")
        raise HTTPException(status_code=500, detail="Error during approval")

@router.post("/reject")
def reject_image(
    request: QuarantineActionRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    s3_client = get_s3_client()
    path = request.minio_path
    
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        # Delete from quarantine
        s3_client.delete_object(
            Bucket=settings.MINIO_BUCKET_QUARANTINE,
            Key=path
        )
        return {"status": "success", "message": "Image rejected and explicitly deleted"}
    except ClientError as e:
        logger.error(f"S3 Error rejecting image {path}: {e}")
        raise HTTPException(status_code=500, detail="Storage error during rejection")
    except Exception as e:
        logger.error(f"Error rejecting image {path}: {e}")
        raise HTTPException(status_code=500, detail="Error during rejection")
