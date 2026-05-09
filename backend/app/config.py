from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

_DEFAULT_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
]


def _split_csv(value: object) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in str(value).split(",") if item.strip()]


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_CLEAN: str
    MINIO_BUCKET_QUARANTINE: str
    REDIS_URL: str

    MAX_IMAGE_SIZE_MB: int = Field(default=10, ge=1, le=50)
    RATE_LIMIT_REQUESTS: int = Field(default=100, ge=1, le=10000)
    RATE_LIMIT_PERIOD: int = Field(default=60, ge=1, le=3600)
    MAX_FILENAME_LENGTH: int = Field(default=255, ge=1, le=255)
    ALLOWED_MIME_TYPES: List[str] = Field(default_factory=lambda: list(_DEFAULT_MIME_TYPES))
    TEMP_FILE_TTL_SECONDS: int = Field(default=300, ge=30, le=86400)
    SECRET_KEY: str = Field(min_length=32)
    CORS_ORIGINS: List[str] = Field(default_factory=list)
    LOG_LEVEL: str = Field(default="INFO")

    TEMP_DIR_BASE: str = Field(default="/tmp/sandbox")
    ALLOWED_HOSTS: List[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])
    RATE_LIMIT_ALLOWLIST: List[str] = Field(default_factory=list)
    RATE_LIMIT_BLOCKLIST: List[str] = Field(default_factory=list)

    SANDBOX_MAX_MEMORY_MB: int = Field(default=512, ge=64, le=4096)
    SANDBOX_TIMEOUT_SECONDS: int = Field(default=30, ge=5, le=300)

    @field_validator(
        "CORS_ORIGINS",
        "ALLOWED_MIME_TYPES",
        "ALLOWED_HOSTS",
        "RATE_LIMIT_ALLOWLIST",
        "RATE_LIMIT_BLOCKLIST",
        mode="before",
    )
    @classmethod
    def _parse_csv_list(cls, value: object) -> List[str]:
        items = _split_csv(value)
        return [item.strip() for item in items if item.strip()]

    @field_validator("ALLOWED_MIME_TYPES")
    @classmethod
    def _normalize_mime_types(cls, value: List[str]) -> List[str]:
        return [item.lower() for item in value]

    @field_validator("LOG_LEVEL")
    @classmethod
    def _normalize_log_level(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("LOG_LEVEL must be a standard logging level")
        return normalized

    @field_validator("TEMP_DIR_BASE")
    @classmethod
    def _validate_temp_dir(cls, value: str) -> str:
        if not os.path.isabs(value):
            raise ValueError("TEMP_DIR_BASE must be an absolute path")
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    load_dotenv()
    env_data = dict(os.environ)
    try:
        return Settings.model_validate(env_data)
    except ValidationError as exc:
        raise RuntimeError(f"Invalid configuration: {exc}") from exc


settings = get_settings()
