"""Add user profiles for personalized legal context.

Revision ID: 0006_add_user_profiles
Revises: 0005_add_legal_obligations
Create Date: 2026-05-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_add_user_profiles"
down_revision: str | None = "0005_add_legal_obligations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=220), nullable=True),
        sa.Column("age_range", sa.String(length=40), nullable=True),
        sa.Column("occupation", sa.String(length=160), nullable=True),
        sa.Column("organization", sa.String(length=220), nullable=True),
        sa.Column("industry", sa.String(length=160), nullable=True),
        sa.Column("jurisdiction", sa.String(length=160), nullable=True),
        sa.Column("role_in_matters", sa.String(length=160), nullable=True),
        sa.Column("legal_priority", sa.String(length=160), nullable=True),
        sa.Column("risk_tolerance", sa.String(length=80), nullable=True),
        sa.Column("preferred_language", sa.String(length=80), nullable=True),
        sa.Column("preferred_tone", sa.String(length=120), nullable=True),
        sa.Column("contact_phone", sa.String(length=80), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_profiles_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_profiles")),
        sa.UniqueConstraint("user_id", name=op.f("uq_user_profiles_user_id")),
    )
    op.create_index(op.f("ix_user_profiles_user_id"), "user_profiles", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_profiles_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")
