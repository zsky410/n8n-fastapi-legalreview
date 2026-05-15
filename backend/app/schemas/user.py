from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    role: str
    created_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=220)
    age_range: str | None = Field(default=None, max_length=40)
    occupation: str | None = Field(default=None, max_length=160)
    organization: str | None = Field(default=None, max_length=220)
    industry: str | None = Field(default=None, max_length=160)
    jurisdiction: str | None = Field(default=None, max_length=160)
    role_in_matters: str | None = Field(default=None, max_length=160)
    legal_priority: str | None = Field(default=None, max_length=160)
    risk_tolerance: str | None = Field(default=None, max_length=80)
    preferred_language: str | None = Field(default=None, max_length=80)
    preferred_tone: str | None = Field(default=None, max_length=120)
    contact_phone: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=4000)


class UserProfileRead(UserProfileUpdate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
