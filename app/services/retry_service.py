import logging
import time
from collections.abc import Callable
from typing import TypeVar

ResultT = TypeVar("ResultT")


class RetryService:
    NON_RETRYABLE_MARKERS = (
        "resource_exhausted",
        "quota",
        "rate limit",
        "rate_limit",
        "permission_denied",
        "unauthenticated",
        "forbidden",
        "invalid api key",
        "api key not valid",
        "api_key_invalid",
        "insufficient permissions",
    )

    def __init__(
        self,
        retries: int = 1,
        delay_seconds: float = 0.8,
        should_retry: Callable[[Exception], bool] | None = None,
    ) -> None:
        self.retries = retries
        self.delay_seconds = delay_seconds
        self.should_retry = should_retry or self._default_should_retry
        self.logger = logging.getLogger(__name__)

    def _default_should_retry(self, error: Exception) -> bool:
        normalized_error = str(error).strip().lower()
        return not any(marker in normalized_error for marker in self.NON_RETRYABLE_MARKERS)

    def run(
        self,
        operation: Callable[[], ResultT],
        *,
        context: str = "operation",
    ) -> ResultT:
        last_error: Exception | None = None

        for attempt in range(1, self.retries + 2):
            try:
                return operation()
            except Exception as exc:
                last_error = exc
                if attempt > self.retries:
                    break

                if not self.should_retry(exc):
                    self.logger.warning(
                        "Skipping retry for %s after non-retryable failure on attempt %s/%s: %s",
                        context,
                        attempt,
                        self.retries + 1,
                        exc,
                    )
                    break

                self.logger.warning(
                    "Retrying %s after failure on attempt %s/%s: %s",
                    context,
                    attempt,
                    self.retries + 1,
                    exc,
                )
                time.sleep(self.delay_seconds)

        if last_error is not None:
            raise last_error

        raise RuntimeError(f"{context} failed without a captured exception.")
