import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.document_chat import DocumentChatMessage
    from app.models.legal_obligation import LegalObligation
    from app.models.review import Review
    from app.models.risk_finding import RiskFinding
    from app.models.user import User


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    processing_status: Mapped[str] = mapped_column(String(40), nullable=False, default="pending")
    review_status: Mapped[str] = mapped_column(String(40), nullable=False, default="processing")
    classification: Mapped[str | None] = mapped_column(String(80))
    classification_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    summary: Mapped[str | None] = mapped_column(Text)
    ai_thinking_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    flag_reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="documents")
    risk_findings: Mapped[list["RiskFinding"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    legal_obligations: Mapped[list["LegalObligation"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    chat_messages: Mapped[list["DocumentChatMessage"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
