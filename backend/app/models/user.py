import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.document import Document
    from app.models.document_chat import DocumentChatMessage
    from app.models.review import Review


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="reviewer")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="actor")
    document_chat_messages: Mapped[list["DocumentChatMessage"]] = relationship(back_populates="user")
