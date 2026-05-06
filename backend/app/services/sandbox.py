from __future__ import annotations

import os
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Dict, Optional

from app.config import settings
from app.security import audit_log

try:
    import resource
except ImportError:  # pragma: no cover
    resource = None


class SecureSandbox:
    def __init__(
        self,
        base_dir: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        memory_limit_mb: Optional[int] = None,
    ) -> None:
        self.base_dir = base_dir or settings.TEMP_DIR_BASE
        self.timeout_seconds = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS
        self.memory_limit_mb = memory_limit_mb or settings.SANDBOX_MAX_MEMORY_MB

    def create_sandbox_directory(self) -> str:
        os.makedirs(self.base_dir, mode=0o700, exist_ok=True)
        sandbox_id = uuid.uuid4().hex
        sandbox_path = os.path.join(self.base_dir, sandbox_id)
        os.makedirs(sandbox_path, mode=0o700, exist_ok=False)
        return sandbox_path

    def cleanup_sandbox(self, sandbox_path: str) -> None:
        if sandbox_path and os.path.isdir(sandbox_path):
            shutil.rmtree(sandbox_path, ignore_errors=True)

    def execute_in_sandbox(self, func, *args, timeout: Optional[int] = None, memory_limit_mb: Optional[int] = None, **kwargs):
        timeout = timeout or self.timeout_seconds
        memory_limit_mb = memory_limit_mb or self.memory_limit_mb

        def _runner():
            old_limits = self._apply_resource_limits(memory_limit_mb, timeout)
            try:
                return func(*args, **kwargs)
            finally:
                self._restore_resource_limits(old_limits)

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_runner)
            try:
                return future.result(timeout=timeout)
            except FuturesTimeoutError as exc:
                audit_log("sandbox_timeout", {"timeout_seconds": timeout})
                raise TimeoutError("Sandbox execution timed out") from exc

    def _apply_resource_limits(self, memory_limit_mb: int, timeout_seconds: int):
        if resource is None:
            return None

        limits: Dict[str, object] = {}

        try:
            limits["as"] = resource.getrlimit(resource.RLIMIT_AS)
            resource.setrlimit(
                resource.RLIMIT_AS,
                (memory_limit_mb * 1024 * 1024, limits["as"][1]),
            )
        except Exception:
            pass

        try:
            limits["cpu"] = resource.getrlimit(resource.RLIMIT_CPU)
            resource.setrlimit(resource.RLIMIT_CPU, (timeout_seconds, limits["cpu"][1]))
        except Exception:
            pass

        return limits

    def _restore_resource_limits(self, limits: Optional[Dict[str, object]]) -> None:
        if resource is None or not limits:
            return

        if "as" in limits:
            try:
                resource.setrlimit(resource.RLIMIT_AS, limits["as"])
            except Exception:
                pass

        if "cpu" in limits:
            try:
                resource.setrlimit(resource.RLIMIT_CPU, limits["cpu"])
            except Exception:
                pass
