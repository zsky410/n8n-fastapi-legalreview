"""Add ai_thinking_log for live AI reasoning during review.

Revision ID: 0002_add_ai_thinking_log
Revises: 0001_initial_schema
Create Date: 2026-05-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_ai_thinking_log"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("ai_thinking_log", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "ai_thinking_log")
