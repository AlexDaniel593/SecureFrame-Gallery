from __future__ import annotations

import logging
import os
import re
import uuid
from typing import Dict

import bleach

from app.config import settings

SAFE_FILENAME_PATTERN = re.compile(r"[^A-Za-z0-9._-]")

audit_logger = logging.getLogger("audit")


def sanitize_filename(filename: str) -> str:
    if not filename:
        raise ValueError("Filename is required")

    name = os.path.basename(filename)
    name = bleach.clean(name, strip=True)
    name = name.replace(" ", "_")
    name = SAFE_FILENAME_PATTERN.sub("", name)
    name = name.lstrip(".")

    if not name:
        raise ValueError("Invalid filename")

    return name[: settings.MAX_FILENAME_LENGTH]


def validate_file_size(file_size: int) -> bool:
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    return file_size <= max_bytes


def generate_secure_temp_filename(original_name: str) -> str:
    safe_name = sanitize_filename(original_name)
    return f"{uuid.uuid4().hex}_{safe_name}"


def audit_log(event: str, details: Dict[str, object]) -> None:
    payload = {"event": event, "details": details}
    audit_logger.info(event, extra=payload)


def verify_image_not_executable(file_path: str) -> bool:
    try:
        with open(file_path, "rb") as file_handle:
            header = file_handle.read(4)
    except OSError:
        return False

    if header.startswith(b"MZ"):
        return False
    if header.startswith(b"\x7fELF"):
        return False
    if header.startswith(b"#!"):
        return False
    if header in {b"\xfe\xed\xfa\xce", b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe", b"\xce\xfa\xed\xfe"}:
        return False

    return True
