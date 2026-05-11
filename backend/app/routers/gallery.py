import logging
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.routers.quarantine import get_public_s3_client

logger = logging.getLogger("app.gallery")

router = APIRouter(prefix="/gallery", tags=["Gallery"])


@router.get("/presigned-url")
def get_gallery_presigned_url(
    path: str = Query(..., description="MinIO path of the clean image"),
):
    """Endpoint público para obtener URLs prefirmadas de imágenes CLEAN."""
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")

    s3_client = get_public_s3_client()
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.MINIO_BUCKET_CLEAN,
                "Key": path,
            },
            ExpiresIn=3600,  # 1 hora
        )
        return {"url": url}
    except Exception as e:
        logger.error(f"Error generating presigned url for clean image: {e}")
        raise HTTPException(status_code=500, detail="Error generating url")
