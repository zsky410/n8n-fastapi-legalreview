from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, date, datetime

from app.services.classification import ClassificationResult
from app.services.extraction import ExtractionResult


@dataclass
class RiskFindingData:
    rule_code: str
    severity: str
    snippet: str | None
    suggestion: str
    score: int


SEVERITY_SCORES = {
    "low": 10,
    "medium": 15,
    "high": 25,
    "critical": 40,
}


def evaluate_risks(
    *,
    text: str,
    extraction: ExtractionResult,
    classification: ClassificationResult,
) -> tuple[list[RiskFindingData], int, list[str], date | None]:
    findings: list[RiskFindingData] = []
    lowered = text.lower()
    expiry_date = extraction.expiry_date

    def add(rule_code: str, severity: str, snippet: str | None, suggestion: str) -> None:
        findings.append(
            RiskFindingData(
                rule_code=rule_code,
                severity=severity,
                snippet=snippet,
                suggestion=suggestion,
                score=SEVERITY_SCORES[severity],
            )
        )

    if not any(token in lowered for token in ("signature", "signed by", "authorized signatory", "executed by")):
        add(
            "MISSING_SIGNATURE",
            "high",
            "No signature language was detected.",
            "Confirm the agreement includes signature and execution details.",
        )

    amount = detect_high_value_amount(text)
    if amount is not None and amount >= 100_000:
        add(
            "HIGH_VALUE",
            "critical",
            f"Detected amount {amount:,.2f}.",
            "Escalate high-value documents for manual approval.",
        )

    if expiry_date is not None:
        days_left = (expiry_date - datetime.now(UTC).date()).days
        if 0 <= days_left <= 30:
            add(
                "EXPIRY_SOON",
                "medium",
                f"Document appears to expire on {expiry_date.isoformat()}",
                "Review renewal or extension terms before the expiry window closes.",
            )

    if classification.document_type in {"contract", "nda"} and not any(
        token in lowered for token in ("termination", "terminate", "terminated")
    ):
        add(
            "NO_TERMINATION_CLAUSE",
            "high",
            "No termination clause keywords were found.",
            "Add explicit termination rights and notice periods.",
        )

    if classification.document_type in {"contract", "nda"} and not any(
        token in lowered for token in ("governing law", "jurisdiction", "venue")
    ):
        add(
            "NO_GOVERNING_LAW",
            "medium",
            "No governing law or jurisdiction clause was detected.",
            "Specify the governing law and venue for dispute resolution.",
        )

    if "indemnify" in lowered or "hold harmless" in lowered:
        add(
            "BROAD_INDEMNITY",
            "high",
            "Indemnity language was found.",
            "Review whether indemnity obligations are appropriately limited.",
        )

    if any(token in lowered for token in ("auto renew", "automatic renewal", "automatically renew")):
        add(
            "AUTO_RENEWAL",
            "medium",
            "Auto-renewal language was found.",
            "Confirm renewal notice periods and opt-out conditions.",
        )

    if extraction.quality_label == "low":
        add(
            "LOW_EXTRACTION_QUALITY",
            "high",
            "The extracted text was too short or low quality.",
            "Check the source document quality or upload a text-based version.",
        )

    if classification.document_type == "unknown":
        add(
            "UNKNOWN_DOC_TYPE",
            "medium",
            "The document could not be confidently classified.",
            "Route to manual review or improve document classification rules.",
        )

    if classification.confidence < 0.55:
        add(
            "CONFIDENCE_LOW",
            "medium",
            f"Classification confidence is {classification.confidence:.2f}.",
            "Review the document manually before trusting the automated verdict.",
        )

    risk_score = min(100, sum(finding.score for finding in findings))
    flag_reasons = [finding.rule_code for finding in findings]
    return findings, risk_score, flag_reasons, expiry_date


def detect_high_value_amount(text: str) -> float | None:
    matches = re.finditer(r"(?:USD|\$)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)", text)
    amounts = []
    for match in matches:
        try:
            amounts.append(float(match.group(1).replace(",", "")))
        except ValueError:
            continue
    if not amounts:
        return None
    return max(amounts)
