from __future__ import annotations

import logging
from typing import Dict

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger("app.auth")
bearer_scheme = HTTPBearer(auto_error=False)


def verify_nextauth_jwt(token: str) -> Dict[str, object]:
    """
    Verifica un JWT emitido por NextAuth v5.
    NextAuth usa HS256 con AUTH_SECRET como clave.
    """
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {exc}",
        )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Dict[str, object]:
    """
    Dependencia de FastAPI que extrae y valida el JWT de NextAuth
    del header Authorization: Bearer <token>.
    """
    # También permitir token en cookie (para compatibilidad con NextAuth)
    auth_header = request.headers.get("Authorization", "")

    if auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ")
    elif credentials is not None:
        token = credentials.credentials
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
        )

    payload = verify_nextauth_jwt(token)
    logger.info("Usuario autenticado: id=%s role=%s", payload.get("sub"), payload.get("role"))
    return payload