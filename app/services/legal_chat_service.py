import logging

from app.core.config import Settings, get_settings
from app.prompts.legal_chat import build_legal_chat_prompt
from app.schemas.legal_chat import LegalChatLLMOutput, LegalChatRequest, LegalChatResponse
from app.services.gemini_client import GeminiClient
from app.services.parser_service import ParserService
from app.services.retry_service import RetryService


class LegalChatService:
    def __init__(
        self,
        settings: Settings | None = None,
        parser_service: ParserService | None = None,
        retry_service: RetryService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.gemini_client = GeminiClient(self.settings)
        self.parser_service = parser_service or ParserService()
        self.retry_service = retry_service or RetryService()
        self.logger = logging.getLogger(__name__)

    def answer(self, payload: LegalChatRequest) -> LegalChatResponse:
        if self.gemini_client.is_enabled():
            try:
                llm_output = self._run_live_chat(payload)
            except Exception as exc:
                self.logger.warning(
                    "Gemini live chat failed for caseId=%s, falling back to bootstrap mode: %s",
                    payload.caseId,
                    exc,
                )
                llm_output = self._build_fallback_output(payload)
        else:
            llm_output = self._build_fallback_output(payload)

        return LegalChatResponse(
            caseId=payload.caseId,
            answer=llm_output.answer,
            citations=llm_output.citations,
            caution=llm_output.caution,
            confidence=llm_output.confidence,
            needsAttention=llm_output.needsAttention,
            disclaimer=self.settings.disclaimer,
        )

    def _run_live_chat(self, payload: LegalChatRequest) -> LegalChatLLMOutput:
        prompt = build_legal_chat_prompt(payload)

        def generate_parse_normalize() -> LegalChatLLMOutput:
            raw_response = self.gemini_client.generate_text(prompt)
            self.logger.debug("Gemini legal chat raw response: %s", raw_response[:1000])
            parsed = self.parser_service.parse_model(raw_response, LegalChatLLMOutput)

            return self._normalize_llm_output(parsed)

        return self.retry_service.run(
            generate_parse_normalize,
            context="legal_chat_gemini",
        )

    def _normalize_llm_output(self, payload: LegalChatLLMOutput) -> LegalChatLLMOutput:
        answer = " ".join(payload.answer.split())
        caution = " ".join(payload.caution.split()) if payload.caution else None
        normalized_citations = []

        for citation in payload.citations[:5]:
            excerpt = " ".join(citation.excerpt.split())
            if not excerpt:
                continue

            normalized_citations.append(
                {
                    "excerpt": excerpt,
                    "source": " ".join(citation.source.split()) if citation.source else None,
                    "rationale": " ".join(citation.rationale.split()) if citation.rationale else None,
                }
            )

        return LegalChatLLMOutput.model_validate(
            {
                "answer": answer or "Khong the tao cau tra loi tu dau vao hien tai.",
                "citations": normalized_citations,
                "caution": caution,
                "confidence": round(max(0.0, min(float(payload.confidence), 1.0)), 2),
                "needsAttention": bool(payload.needsAttention),
            }
        )

    def _build_fallback_output(self, payload: LegalChatRequest) -> LegalChatLLMOutput:
        lowered = payload.question.lower()

        if "tom tat" in lowered or "summary" in lowered:
            answer = (
                "He thong dang o che do bootstrap cho chat. Ban nen xem AI review truoc, "
                "sau do uu tien cac dieu khoan ve phat, cham dut don phuong va co che tranh chap."
            )
        elif "rui ro" in lowered or "risk" in lowered or "dieu khoan" in lowered:
            answer = (
                "Can uu tien xem lai dieu khoan phat, quyen cham dut don phuong, "
                "co che giai quyet tranh chap va luat ap dung cua tai lieu."
            )
        else:
            answer = (
                "He thong da nhan cau hoi cho ho so nay. Trong che do bootstrap, "
                "hay doi chieu cau tra loi voi ket qua AI review va van ban goc."
            )

        return LegalChatLLMOutput(
            answer=answer,
            citations=[],
            caution="Can doi chieu voi tai lieu goc va y kien tu van phap ly chuyen nghiep.",
            confidence=0.42,
            needsAttention="khieu kien" in lowered or "court" in lowered or "litigation" in lowered,
        )
