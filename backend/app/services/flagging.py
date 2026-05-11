from __future__ import annotations

from dataclasses import dataclass

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
    has_high_severity = any(finding.severity in {"high", "critical"} for finding in findings)
    should_flag = (
        risk_score >= 60
        or has_high_severity
        or classification_confidence < 0.55
        or extraction_quality_label == "low"
    )

    if should_flag:
        return FlaggingDecision(review_status="pending_admin", verdict="needs_review")
    return FlaggingDecision(review_status="ai_approved", verdict="approve")

