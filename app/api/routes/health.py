from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse
from app.services.system_health_service import SystemHealthService

router = APIRouter(tags=["health"])


def get_system_health_service(settings: Settings = Depends(get_settings)) -> SystemHealthService:
    return SystemHealthService(settings)


@router.get("/health", response_model=HealthResponse)
def health_check(
    settings: Settings = Depends(get_settings),
    health_service: SystemHealthService = Depends(get_system_health_service),
) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
        timestamp=datetime.now(timezone.utc).isoformat(),
        dependencies=health_service.check_dependencies(),
    )
