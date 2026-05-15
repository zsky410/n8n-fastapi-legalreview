NEEDS_REVIEW = "needs_reviewer"
AI_APPROVED = "ai_approved"
REVIEWER_APPROVED = "reviewer_approved"
REVIEWER_REJECTED = "reviewer_rejected"
FAILED = "failed"
PROCESSING = "processing"

LEGACY_PENDING_ADMIN = "pending_admin"
LEGACY_ADMIN_APPROVED = "admin_approved"
LEGACY_ADMIN_REJECTED = "admin_rejected"

HUMAN_REVIEW_PENDING_STATUSES = {NEEDS_REVIEW, LEGACY_PENDING_ADMIN}
HUMAN_APPROVED_STATUSES = {REVIEWER_APPROVED, LEGACY_ADMIN_APPROVED}
HUMAN_REJECTED_STATUSES = {REVIEWER_REJECTED, LEGACY_ADMIN_REJECTED}
APPROVED_STATUSES = {AI_APPROVED, *HUMAN_APPROVED_STATUSES}


def is_human_review_pending(status: str) -> bool:
    return status in HUMAN_REVIEW_PENDING_STATUSES


def count_statuses(status_counts: dict[str, int], statuses: set[str] | tuple[str, ...] | list[str]) -> int:
    return sum(status_counts.get(status, 0) for status in statuses)
