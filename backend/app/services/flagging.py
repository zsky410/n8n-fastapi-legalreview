from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings
from app.services.risk_engine import RiskFindingData


@dataclass
class FlaggingDecision:
    review_status: str
    verdict: str


def decide_review_status(
    *,
    risk_score: int,
    classification_confidence: float,
    extraction_quality_label: str,
    findings: list[RiskFindingData],
) -> FlaggingDecision:
    high_risk_threshold = max(1, settings.manual_review_risk_score_threshold)
    has_critical_finding = any(finding.severity == "critical" for finding in findings)
    should_flag = (
        risk_score >= high_risk_threshold
        or has_critical_finding
    )

    if should_flag:
        return FlaggingDecision(review_status="pending_admin", verdict="needs_review")
    return FlaggingDecision(review_status="ai_approved", verdict="approve")
