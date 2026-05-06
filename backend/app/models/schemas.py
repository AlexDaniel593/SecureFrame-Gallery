from __future__ import annotations

from datetime import datetime
from typing import Dict, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    filename: str = Field(max_length=255, pattern=r"^[A-Za-z0-9._ -]+$")


class AnalysisResult(BaseModel):
    filename: str
    request_id: UUID
    magic_type: str
    exif_stripped: bool
    stego_score: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    verdict: Literal["CLEAN", "SUSPICIOUS", "MALICIOUS", "ERROR"]
    details: Dict[str, object]
    analyzed_at: datetime
    processing_time_ms: int


class HealthResponse(BaseModel):
    status: str
    version: str
    dependencies: Dict[str, str]


class ErrorResponse(BaseModel):
    error: str
    detail: str
    request_id: str
    timestamp: datetime
