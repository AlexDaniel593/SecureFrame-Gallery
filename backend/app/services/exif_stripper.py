from __future__ import annotations

import os
import shutil
from typing import Dict

from PIL import Image

from app.security import audit_log, verify_image_not_executable

Image.MAX_IMAGE_PIXELS = 70_000_000


def strip_exif(input_path: str) -> str:
    if not verify_image_not_executable(input_path):
        raise ValueError("Executable signature detected")

    backup_path = f"{input_path}.bak"
    temp_path = f"{input_path}.clean"

    shutil.copy2(input_path, backup_path)

    try:
        with Image.open(input_path) as image:
            image.verify()

        with Image.open(input_path) as image:
            exif = image.getexif()
            had_exif = bool(exif)
            had_gps = 34853 in exif
            had_thumbnail = "thumbnail" in image.info

            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")

            clean_image = Image.new(image.mode, image.size)
            clean_image.putdata(list(image.getdata()))
            clean_image.save(temp_path, format=image.format)

        with Image.open(temp_path) as verified_image:
            verified_image.verify()

        os.replace(temp_path, input_path)
        os.remove(backup_path)

        audit_log(
            "exif_stripped",
            {
                "path": input_path,
                "had_exif": had_exif,
                "had_gps": had_gps,
                "had_thumbnail": had_thumbnail,
            },
        )

        return input_path
    except Exception:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(backup_path):
            os.replace(backup_path, input_path)
        raise
