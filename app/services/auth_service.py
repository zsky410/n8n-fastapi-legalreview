import uuid
from datetime import datetime

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.core.security import InvalidTokenError, create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.auth import AuthLoginRequest, AuthRegisterRequest, AuthTokenResponse, AuthUser
from app.services.user_repository import DuplicateEmailError, UserRecord, UserRepository


class AuthService:
    def __init__(
        self,
        settings: Settings | None = None,
        user_repository: UserRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.user_repository = user_repository or UserRepository(self.settings)

    def ensure_schema(self) -> None:
        self.user_repository.ensure_schema()

    def register(self, payload: AuthRegisterRequest) -> AuthTokenResponse:
        self.ensure_schema()
        email = self._normalize_email(payload.email)
        self._ensure_email_allowed(email)

        try:
            user = self.user_repository.create_user(
                user_id=str(uuid.uuid4()),
                email=email,
                password_hash=hash_password(payload.password),
                name=self._normalize_name(payload.name),
                company=self._normalize_company(payload.company),
                role="client",
            )
        except DuplicateEmailError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.",
            ) from exc

        return AuthTokenResponse(
            accessToken=self._build_access_token(user),
            user=self._serialize_user(user),
        )

    def login(self, payload: AuthLoginRequest) -> AuthTokenResponse:
        self.ensure_schema()
        email = self._normalize_email(payload.email)
        user = self.user_repository.get_user_by_email(email)

        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email hoặc mật khẩu không đúng.",
            )

        if user.role != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản này hiện chưa dùng luồng đăng nhập khách hàng.",
            )

        return AuthTokenResponse(
            accessToken=self._build_access_token(user),
            user=self._serialize_user(user),
        )

    def get_current_user(self, token: str) -> AuthUser:
        try:
            claims = decode_access_token(
                token=token,
                secret_key=self.settings.auth_jwt_secret,
                algorithm=self.settings.auth_jwt_algorithm,
            )
        except InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            ) from exc

        user_id = str(claims.get("sub", "")).strip()
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Phiên đăng nhập không hợp lệ.",
            )

        user = self.user_repository.get_user_by_id(user_id)
        if not user or user.role != "client":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Không tìm thấy tài khoản tương ứng với phiên đăng nhập này.",
            )

        return self._serialize_user(user)

    def _build_access_token(self, user: UserRecord) -> str:
        return create_access_token(
            subject=user.id,
            email=user.email,
            role=user.role,
            secret_key=self.settings.auth_jwt_secret,
            algorithm=self.settings.auth_jwt_algorithm,
            expires_minutes=self.settings.auth_access_token_minutes,
        )

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _normalize_name(name: str) -> str:
        normalized = " ".join(name.split())
        if len(normalized) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tên hiển thị cần ít nhất 2 ký tự.",
            )
        return normalized

    @staticmethod
    def _normalize_company(company: str | None) -> str | None:
        if company is None:
            return None
        normalized = " ".join(company.split())
        return normalized or None

    @staticmethod
    def _ensure_email_allowed(email: str) -> None:
        if email == "admin@demo.vn":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đang dành cho tài khoản quản trị demo.",
            )

    @staticmethod
    def _serialize_user(user: UserRecord) -> AuthUser:
        created_at = user.created_at
        if isinstance(created_at, datetime):
            created_at_value = created_at.isoformat()
        else:
            created_at_value = str(created_at)

        return AuthUser(
            id=user.id,
            email=user.email,
            name=user.name,
            company=user.company or "Khách hàng LegalDesk",
            subtitle="Tài khoản khách hàng",
            role=user.role,
            createdAt=created_at_value,
        )
