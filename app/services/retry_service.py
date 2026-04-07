import logging
import time
from collections.abc import Callable
from typing import TypeVar

ResultT = TypeVar("ResultT")


class RetryService:
    def __init__(self, retries: int = 2, delay_seconds: float = 0.8) -> None:
        self.retries = retries
        self.delay_seconds = delay_seconds
        self.logger = logging.getLogger(__name__)

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
