"""Add legal obligations.

Revision ID: 0005_add_legal_obligations
Revises: 0004_review_status_rename
Create Date: 2026-05-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_add_legal_obligations"
down_revision: str | None = "0004_review_status_rename"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "legal_obligations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("responsible_party", sa.String(length=220), nullable=True),
        sa.Column("obligation_type", sa.String(length=80), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("urgency", sa.String(length=40), nullable=False),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("source_excerpt", sa.Text(), nullable=True),
        sa.Column("consequence", sa.Text(), nullable=True),
        sa.Column("recommended_action", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_legal_obligations_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_legal_obligations")),
    )
    op.create_index(
        op.f("ix_legal_obligations_document_id"),
        "legal_obligations",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        "ix_legal_obligations_due_date",
        "legal_obligations",
        ["due_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_legal_obligations_due_date", table_name="legal_obligations")
    op.drop_index(op.f("ix_legal_obligations_document_id"), table_name="legal_obligations")
    op.drop_table("legal_obligations")
