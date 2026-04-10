import logging
import unicodedata

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
        fallback_reason = ""

        if self.gemini_client.is_enabled():
            try:
                llm_output = self._run_live_chat(payload)
            except Exception as exc:
                fallback_reason = str(exc)
                self.logger.warning(
                    "Gemini live chat failed for caseId=%s, falling back to bootstrap mode: %s",
                    payload.caseId,
                    exc,
                )
                llm_output = self._build_fallback_output(payload, fallback_reason)
        else:
            llm_output = self._build_fallback_output(payload, "Gemini live calls are disabled.")

        return LegalChatResponse(
            caseId=payload.caseId,
            answer=llm_output.answer,
            citations=llm_output.citations,
            caution=llm_output.caution,
            confidence=llm_output.confidence,
            needsAttention=llm_output.needsAttention,
            disclaimer=self.settings.disclaimer,
        )

    @staticmethod
    def _normalize_for_matching(value: str) -> str:
        normalized = unicodedata.normalize("NFD", value)
        without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
        return without_marks.lower()

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
                "answer": answer or "Không thể tạo câu trả lời từ đầu vào hiện tại.",
                "citations": normalized_citations,
                "caution": caution,
                "confidence": round(max(0.0, min(float(payload.confidence), 1.0)), 2),
                "needsAttention": bool(payload.needsAttention),
            }
        )

    def _build_fallback_output(self, payload: LegalChatRequest, reason: str = "") -> LegalChatLLMOutput:
        lowered = self._normalize_for_matching(payload.question)
        normalized_reason = self._normalize_for_matching(reason)

        if "tom tat" in lowered or "summary" in lowered:
            answer = (
                "Hiện hệ thống đang trả lời theo chế độ dự phòng. Từ góc nhìn pháp lý tổng quát, bạn nên ưu tiên rà soát "
                "điều khoản phạt vi phạm, quyền chấm dứt đơn phương, cơ chế giải quyết tranh chấp và luật áp dụng."
            )
        elif "rui ro" in lowered or "risk" in lowered or "dieu khoan" in lowered:
            answer = (
                "Bạn nên xem kỹ các điều khoản về phạt vi phạm, chấm dứt đơn phương, giới hạn trách nhiệm, "
                "giải quyết tranh chấp và luật áp dụng vì đây thường là nhóm rủi ro ảnh hưởng trực tiếp đến nghĩa vụ của các bên."
            )
        else:
            answer = (
                "Hệ thống đã nhận câu hỏi cho hồ sơ này. Trong chế độ dự phòng, bạn nên đối chiếu câu trả lời với kết quả review hiện có "
                "và văn bản gốc trước khi sử dụng cho quyết định pháp lý."
            )

        if "quota" in normalized_reason or "resource_exhausted" in normalized_reason:
            caution = "Gemini đang vượt hạn mức sử dụng, nên hệ thống tạm thời trả lời theo chế độ dự phòng. Hãy thử lại sau ít phút."
        elif "unavailable" in normalized_reason or "high demand" in normalized_reason:
            caution = "Gemini đang quá tải tạm thời, nên hệ thống chuyển sang chế độ dự phòng. Hãy thử lại sau."
        else:
            caution = "Cần đối chiếu với tài liệu gốc và ý kiến tư vấn pháp lý chuyên nghiệp."

        return LegalChatLLMOutput(
            answer=answer,
            citations=[],
            caution=caution,
            confidence=0.42,
            needsAttention="khieu kien" in lowered or "khieu nai" in lowered or "court" in lowered or "litigation" in lowered,
        )
