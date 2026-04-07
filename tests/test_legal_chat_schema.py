from app.schemas.legal_chat import LegalChatRequest, LegalChatResponse


def test_legal_chat_schema_supports_context_contract() -> None:
    payload = LegalChatRequest.model_validate(
        {
            "caseId": "case_001",
            "question": "Hop dong nay co dieu khoan nao can xem lai?",
            "language": "vi",
            "conversationContext": [
                {
                    "role": "user",
                    "content": "Hay tom tat tai lieu nay.",
                }
            ],
        }
    )

    assert payload.caseId == "case_001"
    assert payload.conversationContext[0].role == "user"


def test_legal_chat_response_schema_is_available() -> None:
    payload = LegalChatResponse.model_validate(
        {
            "caseId": "case_001",
            "answer": "Can xem lai dieu khoan phat va cham dut don phuong.",
            "citations": [
                {
                    "excerpt": "The late payment penalty is 25%.",
                    "source": "document_text",
                    "rationale": "This clause may be disproportionate.",
                }
            ],
            "caution": "Can doi chieu voi ban goc.",
            "confidence": 0.74,
            "needsAttention": False,
            "disclaimer": "Ket qua AI chi co gia tri tham khao.",
        }
    )

    assert payload.confidence == 0.74
