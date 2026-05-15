import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    full_name: Mapped[str | None] = mapped_column(String(220), nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(40), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(160), nullable=True)
    organization: Mapped[str | None] = mapped_column(String(220), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(160), nullable=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(160), nullable=True)
    role_in_matters: Mapped[str | None] = mapped_column(String(160), nullable=True)
    legal_priority: Mapped[str | None] = mapped_column(String(160), nullable=True)
    risk_tolerance: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferred_tone: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="profile")
