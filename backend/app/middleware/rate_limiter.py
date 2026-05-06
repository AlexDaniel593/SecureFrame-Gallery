from __future__ import annotations

from typing import Dict

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings
from app.security import audit_log


def _is_allowlisted(ip_address: str) -> bool:
    return ip_address in set(settings.RATE_LIMIT_ALLOWLIST)


def _is_blocklisted(ip_address: str) -> bool:
    return ip_address in set(settings.RATE_LIMIT_BLOCKLIST)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_PERIOD}seconds"],
)


class AllowlistSlowAPIMiddleware(SlowAPIMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        ip_address = get_remote_address(request)
        if _is_allowlisted(ip_address):
            request.state._rate_limiting_complete = True
        return await super().dispatch(request, call_next)


class IPBlocklistMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        ip_address = get_remote_address(request)
        if _is_blocklisted(ip_address):
            audit_log("ip_blocked", {"ip": ip_address, "path": request.url.path})
            return JSONResponse(
                status_code=403,
                content={"error": "forbidden", "detail": "Access denied"},
            )
        return await call_next(request)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    ip_address = get_remote_address(request)
    audit_log(
        "rate_limit_exceeded",
        {"ip": ip_address, "path": request.url.path, "limit": str(exc.limit)},
    )
    return JSONResponse(
        status_code=429,
        content={"error": "rate_limited", "detail": "Too many requests"},
    )
