from __future__ import annotations

from typing import Dict, Tuple

import magic
from PIL import Image

from app.config import settings
from app.security import verify_image_not_executable

Image.MAX_IMAGE_PIXELS = 70_000_000


def validate_image(file_path: str) -> Dict[str, object]:
    if not verify_image_not_executable(file_path):
        return {
            "valid": False,
            "reason": "Executable signature detected",
            "mime_type": "unknown",
            "description": "Executable content",
            "dimensions": None,
            "pixel_count": 0,
        }

    mime_type = magic.from_file(file_path, mime=True)
    description = magic.from_file(file_path, mime=False)

    if mime_type == "application/octet-stream":
        try:
            with Image.open(file_path) as img:
                mime_type = img.format.lower()
                if mime_type == "jpeg":
                    mime_type = "image/jpeg"
                else:
                    mime_type = f"image/{mime_type}"
        except Exception:
            pass

    if mime_type not in settings.ALLOWED_MIME_TYPES:
        return {
            "valid": False,
            "reason": f"Unsupported MIME type: {mime_type}",
            "mime_type": mime_type,
            "description": description,
            "dimensions": None,
            "pixel_count": 0,
        }

    try:
        with Image.open(file_path) as image:
            image.verify()
        with Image.open(file_path) as image:
            width, height = image.size
    except Exception as exc:
        return {
            "valid": False,
            "reason": f"Invalid image: {exc.__class__.__name__}",
            "mime_type": mime_type,
            "description": description,
            "dimensions": None,
            "pixel_count": 0,
        }

    if width > 8000 or height > 8000 or width < 16 or height < 16:
        return {
            "valid": False,
            "reason": "Image dimensions out of bounds",
            "mime_type": mime_type,
            "description": description,
            "dimensions": (width, height),
            "pixel_count": width * height,
        }

    pixel_count = width * height
    if pixel_count > 70_000_000:
        return {
            "valid": False,
            "reason": "Image exceeds pixel limit",
            "mime_type": mime_type,
            "description": description,
            "dimensions": (width, height),
            "pixel_count": pixel_count,
        }

    return {
        "valid": True,
        "reason": "ok",
        "mime_type": mime_type,
        "description": description,
        "dimensions": (width, height),
        "pixel_count": pixel_count,
    }
