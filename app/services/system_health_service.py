import logging

import psycopg
import redis

from app.core.config import Settings
from app.schemas.health import DependencyStatus


class SystemHealthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logger = logging.getLogger(__name__)

    def check_dependencies(self) -> dict[str, DependencyStatus]:
        return {
            "postgres": self._check_postgres(),
            "redis": self._check_redis(),
        }

    def _check_postgres(self) -> DependencyStatus:
        try:
            with psycopg.connect(
                self.settings.database_url,
                connect_timeout=self.settings.healthcheck_timeout_seconds,
            ) as connection:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()

            return DependencyStatus(status="connected")
        except Exception as exc:
            self.logger.warning("Postgres health check failed: %s", exc)

            return DependencyStatus(status="unavailable", detail=type(exc).__name__)

    def _check_redis(self) -> DependencyStatus:
        client = None

        try:
            client = redis.Redis.from_url(
                self.settings.redis_url,
                socket_connect_timeout=self.settings.healthcheck_timeout_seconds,
                socket_timeout=self.settings.healthcheck_timeout_seconds,
            )
            client.ping()

            return DependencyStatus(status="connected")
        except Exception as exc:
            self.logger.warning("Redis health check failed: %s", exc)

            return DependencyStatus(status="unavailable", detail=type(exc).__name__)
        finally:
            if client is not None:
                client.close()
