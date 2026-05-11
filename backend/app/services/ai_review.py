from __future__ import annotations

import json
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.services.classification import ClassificationResult
from app.services.extraction import ExtractionResult
from app.services.risk_engine import RiskFindingData


@dataclass
class AIReviewResult:
    summary: str
    verdict: str
    confidence: float
    reasoning: list[str]
    provider: str


def review_document_with_ai(
    *,
    text: str,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
) -> AIReviewResult:
    if settings.openai_api_key:
        result = _try_openai_review(
            text=text,
            classification=classification,
            extraction=extraction,
            findings=findings,
            risk_score=risk_score,
        )
        if result is not None:
            return result
    return build_mock_review(
        classification=classification,
        extraction=extraction,
        findings=findings,
        risk_score=risk_score,
    )


def build_mock_review(
    *,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
) -> AIReviewResult:
    reasons = [f"{finding.rule_code}: {finding.suggestion}" for finding in findings[:5]]
    if not reasons:
        reasons = ["No material risk findings were detected by the rules engine."]

    if findings:
        summary = (
            f"This {classification.document_type} was flagged with a risk score of {risk_score}. "
            f"Top issues: {', '.join(finding.rule_code for finding in findings[:3])}."
        )
        verdict = "needs_review"
    else:
        summary = (
            f"This {classification.document_type} appears low risk with extracted text quality "
            f"rated {extraction.quality_label}."
        )
        verdict = "approve"

    confidence = round(
        max(0.35, min(0.97, (classification.confidence * 0.7) + (0.3 if not findings else 0.15))),
        4,
    )
    return AIReviewResult(
        summary=summary,
        verdict=verdict,
        confidence=confidence,
        reasoning=reasons,
        provider="mock",
    )


def _try_openai_review(
    *,
    text: str,
    classification: ClassificationResult,
    extraction: ExtractionResult,
    findings: list[RiskFindingData],
    risk_score: int,
) -> AIReviewResult | None:
    schema = {
        "name": "legal_review_summary",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {"type": "string"},
                "verdict": {"type": "string", "enum": ["approve", "needs_review"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "reasoning": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["summary", "verdict", "confidence", "reasoning"],
        },
        "strict": True,
    }
    findings_payload = [
        {
            "rule_code": finding.rule_code,
            "severity": finding.severity,
            "snippet": finding.snippet,
            "suggestion": finding.suggestion,
        }
        for finding in findings
    ]
    prompt = (
        "You are reviewing a legal document for an internal compliance queue. "
        "Return concise JSON only.\n"
        f"Classification: {classification.document_type} ({classification.confidence:.2f})\n"
        f"Extraction quality: {extraction.quality_label} ({extraction.quality_score:.2f})\n"
        f"Risk score: {risk_score}\n"
        f"Findings: {json.dumps(findings_payload)}\n"
        f"Document excerpt: {text[:6000]}"
    )

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_review_model,
                    "input": prompt,
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": schema["name"],
                            "schema": schema["schema"],
                            "strict": schema["strict"],
                        }
                    },
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return None

    raw_json = payload.get("output_text")
    if not raw_json:
        try:
            raw_json = payload["output"][0]["content"][0]["text"]
        except (KeyError, IndexError, TypeError):
            return None

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError:
        return None

    return AIReviewResult(
        summary=parsed["summary"],
        verdict=parsed["verdict"],
        confidence=normalize_confidence(parsed["confidence"]),
        reasoning=[str(item) for item in parsed["reasoning"]],
        provider="openai",
    )


def normalize_confidence(value: object) -> float:
    confidence = float(value)
    if confidence > 1 and confidence <= 100:
        confidence = confidence / 100
    return round(max(0.0, min(1.0, confidence)), 4)
