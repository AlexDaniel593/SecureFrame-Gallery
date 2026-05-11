from __future__ import annotations

import logging
import os
import shutil
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pythonjsonlogger import jsonlogger
from slowapi.errors import RateLimitExceeded
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import settings
from app.middleware.rate_limiter import (
    AllowlistSlowAPIMiddleware,
    IPBlocklistMiddleware,
    limiter,
    rate_limit_exceeded_handler,
)
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers.analysis import check_dependencies, router as analysis_router
from app.routers.quarantine import router as quarantine_router

def _configure_logging() -> None:
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(settings.LOG_LEVEL)

    audit_logger = logging.getLogger("audit")
    audit_logger.handlers = [handler]
    audit_logger.setLevel(settings.LOG_LEVEL)
    audit_logger.propagate = False


_configure_logging()

app = FastAPI(title="SecureFrame Analysis API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(IPBlocklistMiddleware)
app.add_middleware(AllowlistSlowAPIMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(analysis_router, prefix="/api/v1")
app.include_router(quarantine_router, prefix="/api/v1")

@app.get("/")
def root() -> Dict[str, str]:
    return {"status": "ok", "service": "SecureFrame Analysis API", "version": "1.0.0"}


@app.get("/health")
def health() -> Dict[str, object]:
    dependencies = check_dependencies()
    status = "healthy" if all(value == "ok" for value in dependencies.values()) else "degraded"
    return {"status": status, "version": "1.0.0", "dependencies": dependencies}


def _cleanup_temp_dir() -> None:
    base_dir = settings.TEMP_DIR_BASE
    if not os.path.isdir(base_dir):
        return
    for entry in os.listdir(base_dir):
        path = os.path.join(base_dir, entry)
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
        else:
            try:
                os.remove(path)
            except OSError:
                continue


@app.on_event("shutdown")
def on_shutdown() -> None:
    _cleanup_temp_dir()
