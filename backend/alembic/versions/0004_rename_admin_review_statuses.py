"""Rename admin review statuses to reviewer-oriented statuses.

Revision ID: 0004_review_status_rename
Revises: 0003_add_document_chat_messages
Create Date: 2026-05-15
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0004_review_status_rename"
down_revision: str | None = "0003_add_document_chat_messages"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("UPDATE documents SET review_status = 'needs_reviewer' WHERE review_status = 'pending_admin'")
    op.execute("UPDATE documents SET review_status = 'reviewer_approved' WHERE review_status = 'admin_approved'")
    op.execute("UPDATE documents SET review_status = 'reviewer_rejected' WHERE review_status = 'admin_rejected'")
    op.execute("UPDATE reviews SET decision = 'reviewer_approved' WHERE decision = 'admin_approved'")
    op.execute("UPDATE reviews SET decision = 'reviewer_rejected' WHERE decision = 'admin_rejected'")


def downgrade() -> None:
    op.execute("UPDATE documents SET review_status = 'pending_admin' WHERE review_status = 'needs_reviewer'")
    op.execute("UPDATE documents SET review_status = 'admin_approved' WHERE review_status = 'reviewer_approved'")
    op.execute("UPDATE documents SET review_status = 'admin_rejected' WHERE review_status = 'reviewer_rejected'")
    op.execute("UPDATE reviews SET decision = 'admin_approved' WHERE decision = 'reviewer_approved'")
    op.execute("UPDATE reviews SET decision = 'admin_rejected' WHERE decision = 'reviewer_rejected'")
