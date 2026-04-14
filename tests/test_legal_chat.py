from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_legal_chat_returns_structured_response() -> None:
    with patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=False):
        response = client.post(
            "/v1/legal/chat",
            json={
                "caseId": "case_001",
                "question": "Hop dong nay co dieu khoan nao can xem lai?",
                "language": "vi",
                "conversationContext": [
                    {
                        "role": "user",
                        "content": "Hay tom tat hop dong nay cho toi.",
                    }
                ],
            },
        )

        assert response.status_code == 200

        payload = response.json()

        assert payload["caseId"] == "case_001"
        assert payload["answer"]
        assert 0 <= payload["confidence"] <= 1
        assert isinstance(payload["citations"], list)
        assert payload["disclaimer"]


def test_legal_chat_retries_when_model_returns_invalid_json_then_succeeds() -> None:
    invalid_response = "not-json"
    valid_response = """
    {
      "answer": "Can xem lai dieu khoan phat va cham dut don phuong.",
      "citations": [
        {
          "excerpt": "late payment penalty",
          "source": "document_text",
          "rationale": "Potentially disproportionate."
        }
      ],
      "caution": "Can doi chieu voi ban goc.",
      "confidence": 0.83,
      "needsAttention": true
    }
    """

    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch(
            "app.services.gemini_client.GeminiClient.generate_text",
            side_effect=[invalid_response, valid_response],
        ) as mock_generate,
        patch("app.services.retry_service.time.sleep", return_value=None),
    ):
        response = client.post(
            "/v1/legal/chat",
            json={
                "caseId": "case_retry_chat",
                "question": "Hop dong nay co dieu khoan nao can xem lai?",
                "language": "vi",
                "conversationContext": [
                    {
                        "role": "user",
                        "content": "Hay tom tat hop dong nay cho toi.",
                    }
                ],
            },
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["answer"]
    assert payload["needsAttention"] is True
    assert mock_generate.call_count == 2


def test_legal_chat_falls_back_after_invalid_model_payloads_exhaust_retries() -> None:
    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch(
            "app.services.gemini_client.GeminiClient.generate_text",
            return_value="still-not-json",
        ) as mock_generate,
        patch("app.services.retry_service.time.sleep", return_value=None),
    ):
        response = client.post(
            "/v1/legal/chat",
            json={
                "caseId": "case_fallback_chat",
                "question": "Hop dong nay co dieu khoan nao can xem lai?",
                "language": "vi",
                "conversationContext": [
                    {
                        "role": "user",
                        "content": "Hay tom tat hop dong nay cho toi.",
                    }
                ],
            },
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["answer"]
    assert payload["confidence"] == 0.42
    assert mock_generate.call_count == 2
