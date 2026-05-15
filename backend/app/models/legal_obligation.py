import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class LegalObligation(Base):
    __tablename__ = "legal_obligations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    responsible_party: Mapped[str | None] = mapped_column(String(220))
    obligation_type: Mapped[str] = mapped_column(String(80), nullable=False, default="general")
    due_date: Mapped[date | None] = mapped_column(Date)
    urgency: Mapped[str] = mapped_column(String(40), nullable=False, default="normal")
    severity: Mapped[str] = mapped_column(String(40), nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="open")
    source_excerpt: Mapped[str | None] = mapped_column(Text)
    consequence: Mapped[str | None] = mapped_column(Text)
    recommended_action: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    document = relationship("Document", back_populates="legal_obligations")
