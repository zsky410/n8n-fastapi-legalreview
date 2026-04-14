from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import AuthLoginRequest, AuthRegisterRequest, AuthTokenResponse, AuthUser
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service() -> AuthService:
    return AuthService()


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu access token hợp lệ.",
        )
    return credentials.credentials


def get_current_client_user(
    token: str = Depends(get_bearer_token),
    service: AuthService = Depends(get_auth_service),
) -> AuthUser:
    return service.get_current_user(token)


@router.post("/register", response_model=AuthTokenResponse, summary="Register a client account")
def register_client_account(
    payload: AuthRegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokenResponse:
    return service.register(payload)


@router.post("/login", response_model=AuthTokenResponse, summary="Login a client account")
def login_client_account(
    payload: AuthLoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokenResponse:
    return service.login(payload)


@router.get("/me", response_model=AuthUser, summary="Get current authenticated client profile")
def get_current_client_profile(
    current_user: AuthUser = Depends(get_current_client_user),
) -> AuthUser:
    return current_user
