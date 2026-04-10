from pydantic import Field

from app.schemas.common import ApiBaseModel


class AuthRegisterRequest(ApiBaseModel):
    email: str = Field(min_length=5, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=2, max_length=120)
    company: str | None = Field(default=None, max_length=160)


class AuthLoginRequest(ApiBaseModel):
    email: str = Field(min_length=5, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class AuthUser(ApiBaseModel):
    id: str
    email: str
    name: str
    company: str
    subtitle: str
    role: str
    createdAt: str


class AuthTokenResponse(ApiBaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: AuthUser
