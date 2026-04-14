import logging
import re
import time
import uuid

from app.core.config import Settings, get_settings
from app.prompts.legal_review import build_legal_review_prompt
from app.schemas.common import RiskLevelEnum, RiskSeverityEnum
from app.schemas.legal_review import (
    LegalReviewLLMOutput,
    LegalReviewRequest,
    LegalReviewResponse,
    ReviewMeta,
    RiskFlag,
)
from app.services.gemini_client import GeminiClient
from app.services.parser_service import ParserService
from app.services.retry_service import RetryService


class LegalReviewService:
    def __init__(
        self,
        settings: Settings | None = None,
        parser_service: ParserService | None = None,
        retry_service: RetryService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.gemini_client = GeminiClient(self.settings)
        self.parser_service = parser_service or ParserService()
        self.retry_service = retry_service or RetryService(
            retries=self.settings.llm_max_retries,
            delay_seconds=self.settings.llm_retry_delay_seconds,
        )
        self.logger = logging.getLogger(__name__)

    def analyze(self, payload: LegalReviewRequest) -> LegalReviewResponse:
        started_at = time.perf_counter()
        request_id = str(uuid.uuid4())
        provider = "bootstrap"
        model_name = "bootstrap-fallback"

        self.logger.info(
            "Running legal review analysis for caseId=%s with model=%s",
            payload.caseId,
            self.settings.gemini_model,
        )

        if self.gemini_client.is_enabled():
            try:
                llm_output = self._run_live_review(payload)
                provider = "gemini"
                model_name = self.settings.gemini_model
            except Exception as exc:
                self.logger.warning(
                    "Gemini live review failed for caseId=%s, falling back to bootstrap mode: %s",
                    payload.caseId,
                    exc,
                )
                llm_output = self._build_bootstrap_output(payload)
        else:
            llm_output = self._build_bootstrap_output(payload)

        processing_ms = int((time.perf_counter() - started_at) * 1000)

        return LegalReviewResponse(
            caseId=payload.caseId,
            docType=llm_output.docType,
            confidence=llm_output.confidence,
            riskScore=llm_output.riskScore,
            riskLevel=llm_output.riskLevel,
            riskFlags=llm_output.riskFlags,
            extractedFields=llm_output.extractedFields,
            recommendedAction=llm_output.recommendedAction,
            summary=llm_output.summary,
            needsAttention=llm_output.needsAttention,
            qualityWarning=llm_output.qualityWarning,
            disclaimer=self.settings.disclaimer,
            meta=ReviewMeta(
                requestId=request_id,
                provider=provider,
                model=model_name,
                processingMs=processing_ms,
            ),
        )

    def _run_live_review(self, payload: LegalReviewRequest) -> LegalReviewLLMOutput:
        prompt = build_legal_review_prompt(payload)

        def generate_parse_normalize() -> LegalReviewLLMOutput:
            raw_response = self.gemini_client.generate_text(prompt)
            self.logger.debug("Gemini legal review raw response: %s", raw_response[:1000])
            parsed = self.parser_service.parse_model(raw_response, LegalReviewLLMOutput)

            return self._normalize_llm_output(parsed)

        return self.retry_service.run(
            generate_parse_normalize,
            context="legal_review_gemini",
        )

    def _build_bootstrap_output(self, payload: LegalReviewRequest) -> LegalReviewLLMOutput:
        doc_type = self._detect_doc_type(payload)
        extracted_fields = self._extract_fields(payload.extractedText)
        risk_flags = self._build_risk_flags(payload.extractedText, extracted_fields)
        risk_score = self._calculate_risk_score(risk_flags)
        risk_level = self._map_risk_level(risk_score)
        quality_warning = self._is_quality_warning(payload.extractedText, extracted_fields)
        confidence = self._calculate_confidence(payload, quality_warning, extracted_fields)
        needs_attention = risk_score >= 70 or confidence < 0.55
        recommended_action = self._recommended_action(risk_level, needs_attention)
        summary = self._build_summary(doc_type, risk_level, risk_flags, quality_warning)

        return LegalReviewLLMOutput(
            docType=doc_type,
            confidence=confidence,
            riskScore=risk_score,
            riskLevel=risk_level,
            riskFlags=risk_flags,
            extractedFields=extracted_fields,
            recommendedAction=recommended_action,
            summary=summary,
            needsAttention=needs_attention,
            qualityWarning=quality_warning,
        )

    def _normalize_llm_output(self, payload: LegalReviewLLMOutput) -> LegalReviewLLMOutput:
        risk_level = RiskLevelEnum(payload.riskLevel)
        risk_flags: list[RiskFlag] = []
        seen_codes: set[str] = set()

        for flag in payload.riskFlags:
            code = flag.code.strip().lower().replace(" ", "_")
            if not code or code in seen_codes:
                continue

            seen_codes.add(code)
            risk_flags.append(
                RiskFlag(
                    code=code,
                    label=" ".join(flag.label.split()) or code.replace("_", " ").title(),
                    severity=flag.severity,
                    excerpt=" ".join(flag.excerpt.split()) if flag.excerpt else None,
                    rationale=" ".join(flag.rationale.split()) if flag.rationale else None,
                )
            )

        recommended_action = (payload.recommendedAction or "").strip().lower()
        if not recommended_action:
            recommended_action = self._recommended_action(risk_level, payload.needsAttention)

        summary = " ".join(payload.summary.split())
        if not summary:
            summary = self._build_summary(payload.docType, risk_level, risk_flags, payload.qualityWarning)

        normalized_fields = {
            str(key): value
            for key, value in payload.extractedFields.items()
            if key and value not in ("", [], {}, None)
        }

        return LegalReviewLLMOutput(
            docType=(payload.docType or "legal_document").strip().lower(),
            confidence=round(max(0.0, min(float(payload.confidence), 1.0)), 2),
            riskScore=max(0, min(int(payload.riskScore), 100)),
            riskLevel=risk_level,
            riskFlags=risk_flags,
            extractedFields=normalized_fields,
            recommendedAction=recommended_action,
            summary=summary,
            needsAttention=bool(payload.needsAttention),
            qualityWarning=bool(payload.qualityWarning),
        )

    def _detect_doc_type(self, payload: LegalReviewRequest) -> str:
        hint = (payload.metadata.documentTypeHint or "").strip().lower()
        text = payload.extractedText.lower()

        if hint:
            return hint

        keyword_map = {
            "rental_contract": ["lease", "tenant", "landlord", "rent", "premises"],
            "employment_contract": ["employee", "employer", "salary", "probation", "termination"],
            "nda": ["confidential", "non-disclosure", "nda", "proprietary information"],
            "service_agreement": ["service level", "statement of work", "vendor", "client"],
            "litigation_filing": ["plaintiff", "defendant", "petition", "court", "claim"],
            "general_contract": ["agreement", "party", "obligation", "term"],
        }

        for doc_type, keywords in keyword_map.items():
            if any(keyword in text for keyword in keywords):
                return doc_type

        return "legal_document"

    def _extract_fields(self, text: str) -> dict:
        extracted_fields: dict[str, object] = {}

        date_match = re.search(r"\b(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})\b", text)
        if date_match:
            extracted_fields["effectiveDate"] = date_match.group(1)

        governing_law_match = re.search(
            r"(governing law|applicable law|governed by|luat ap dung|luật áp dụng)\s*(?:is|la|là)?\s*[:\-]?\s*([^\n.;]+)",
            text,
            re.IGNORECASE,
        )
        if governing_law_match:
            governing_law = governing_law_match.group(2).strip()
            governing_law = re.sub(r"^(is|la|là)\s+", "", governing_law, flags=re.IGNORECASE)
            governing_law = re.sub(r"\s+(between|giua|giữa)\b.*$", "", governing_law, flags=re.IGNORECASE)
            governing_law = re.sub(r"\s+on\s+\d{4}-\d{2}-\d{2}\b.*$", "", governing_law, flags=re.IGNORECASE)
            extracted_fields["governingLaw"] = governing_law.strip()

        parties_match = re.search(
            r"(between|giua|giữa)\s+(.+?)\s+(and|va|và)\s+(.+?)(?:\s+on\s+\d{4}-\d{2}-\d{2}|[\n.;]|$)",
            text,
            re.IGNORECASE,
        )
        if parties_match:
            extracted_fields["parties"] = [
                parties_match.group(2).strip(),
                parties_match.group(4).strip(),
            ]

        return extracted_fields

    def _build_risk_flags(self, text: str, extracted_fields: dict) -> list[RiskFlag]:
        lowered = text.lower()
        risk_flags: list[RiskFlag] = []

        if "sole discretion" in lowered or "terminate at any time" in lowered:
            risk_flags.append(
                RiskFlag(
                    code="unilateral_termination",
                    label="Unilateral termination power detected",
                    severity=RiskSeverityEnum.HIGH,
                    excerpt="A party may terminate at any time or at sole discretion.",
                    rationale="This clause may create a strong imbalance of obligations.",
                )
            )

        if "penalty" in lowered or "liquidated damages" in lowered:
            risk_flags.append(
                RiskFlag(
                    code="penalty_clause",
                    label="Penalty or liquidated damages clause detected",
                    severity=RiskSeverityEnum.MEDIUM,
                    excerpt="Penalty-related wording appears in the extracted text.",
                    rationale="Penalty clauses should be reviewed for proportionality and enforceability.",
                )
            )

        if "arbitration" not in lowered and "court" not in lowered and "dispute" not in lowered:
            risk_flags.append(
                RiskFlag(
                    code="missing_dispute_resolution",
                    label="Missing dispute resolution language",
                    severity=RiskSeverityEnum.MEDIUM,
                    excerpt=None,
                    rationale="No clear dispute resolution mechanism was detected.",
                )
            )

        if "governingLaw" not in extracted_fields:
            risk_flags.append(
                RiskFlag(
                    code="missing_governing_law",
                    label="Missing governing law field",
                    severity=RiskSeverityEnum.MEDIUM,
                    excerpt=None,
                    rationale="No governing law reference was extracted.",
                )
            )

        if "effectiveDate" not in extracted_fields:
            risk_flags.append(
                RiskFlag(
                    code="missing_effective_date",
                    label="Missing effective date",
                    severity=RiskSeverityEnum.LOW,
                    excerpt=None,
                    rationale="No clear effective date was found in the text.",
                )
            )

        return risk_flags

    def _calculate_risk_score(self, risk_flags: list[RiskFlag]) -> int:
        base_score = 20
        severity_weight = {
            RiskSeverityEnum.LOW: 8,
            RiskSeverityEnum.MEDIUM: 15,
            RiskSeverityEnum.HIGH: 28,
        }

        score = base_score + sum(severity_weight[flag.severity] for flag in risk_flags)

        return min(score, 95)

    def _map_risk_level(self, risk_score: int) -> RiskLevelEnum:
        if risk_score >= 70:
            return RiskLevelEnum.HIGH
        if risk_score >= 40:
            return RiskLevelEnum.MEDIUM

        return RiskLevelEnum.LOW

    def _is_quality_warning(self, text: str, extracted_fields: dict) -> bool:
        word_count = len(text.split())

        return word_count < 80 or len(extracted_fields) < 2

    def _calculate_confidence(
        self,
        payload: LegalReviewRequest,
        quality_warning: bool,
        extracted_fields: dict,
    ) -> float:
        word_count = len(payload.extractedText.split())
        score = 0.55

        score += min(word_count / 600, 0.2)

        if payload.metadata.documentTypeHint:
            score += 0.05

        if len(extracted_fields) >= 2:
            score += 0.08

        if quality_warning:
            score -= 0.15

        return round(max(0.35, min(score, 0.95)), 2)

    def _recommended_action(self, risk_level: RiskLevelEnum, needs_attention: bool) -> str:
        if risk_level == RiskLevelEnum.HIGH or needs_attention:
            return "manual_review_recommended"
        if risk_level == RiskLevelEnum.MEDIUM:
            return "publish_with_warning"

        return "auto_publish"

    def _build_summary(
        self,
        doc_type: str,
        risk_level: RiskLevelEnum,
        risk_flags: list[RiskFlag],
        quality_warning: bool,
    ) -> str:
        if not risk_flags:
            return (
                f"Tài liệu được nhận dạng là {doc_type} với mức rủi ro {risk_level.value}. "
                "Chưa phát hiện cảnh báo lớn trong pha phân tích dự phòng."
            )

        first_flag = risk_flags[0].label
        quality_suffix = " Chất lượng văn bản đầu vào cần được kiểm tra thêm." if quality_warning else ""

        return (
            f"Tài liệu được nhận dạng là {doc_type} với mức rủi ro {risk_level.value}. "
            f"Cảnh báo nổi bật: {first_flag}.{quality_suffix}"
        )
