from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_legal_review_returns_bootstrap_analysis() -> None:
    with patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=False):
        response = client.post(
            "/v1/legal/review",
            json={
                "caseId": "case_001",
                "language": "vi",
                "extractedText": (
                    "This lease agreement is entered into between Landlord A and Tenant B on 2026-04-01. "
                    "The governing law is Vietnamese law. The landlord may terminate at any time at sole discretion. "
                    "A penalty applies if the tenant breaches payment obligations."
                ),
                "metadata": {
                    "documentName": "lease-agreement.pdf",
                    "priority": "high",
                    "submittedBy": "client_123",
                },
            },
        )

        assert response.status_code == 200

        payload = response.json()

        assert payload["caseId"] == "case_001"
        assert payload["docType"] in {"rental_contract", "general_contract", "legal_document"}
        assert 0 <= payload["riskScore"] <= 100
        assert payload["riskLevel"] in {"low", "medium", "high"}
        assert isinstance(payload["riskFlags"], list)
        assert "meta" in payload
        assert payload["meta"]["provider"] == "bootstrap"


def test_legal_review_retries_when_model_returns_invalid_json_then_succeeds() -> None:
    invalid_response = "not-json"
    valid_response = """
    {
      "docType": "lease agreement",
      "confidence": 0.88,
      "riskScore": 72,
      "riskLevel": "high",
      "riskFlags": [
        {
          "code": "termination_risk",
          "label": "Termination risk",
          "severity": "high",
          "excerpt": "terminate at sole discretion",
          "rationale": "This clause is one-sided."
        }
      ],
      "extractedFields": {
        "governingLaw": "Vietnamese law"
      },
      "recommendedAction": "manual_review_recommended",
      "summary": "Can xem lai dieu khoan cham dut don phuong.",
      "needsAttention": true,
      "qualityWarning": false
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
            "/v1/legal/review",
            json={
                "caseId": "case_retry_review",
                "language": "vi",
                "extractedText": (
                    "This lease agreement is governed by Vietnamese law and permits unilateral termination "
                    "with a late payment penalty."
                ),
                "metadata": {
                    "documentName": "lease-agreement.pdf",
                    "priority": "high",
                    "submittedBy": "client_123",
                },
            },
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["docType"] == "lease agreement"
    assert payload["riskLevel"] == "high"
    assert payload["needsAttention"] is True
    assert mock_generate.call_count == 2


def test_legal_review_falls_back_after_invalid_model_payloads_exhaust_retries() -> None:
    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch(
            "app.services.gemini_client.GeminiClient.generate_text",
            return_value="still-not-json",
        ) as mock_generate,
        patch("app.services.retry_service.time.sleep", return_value=None),
    ):
        response = client.post(
            "/v1/legal/review",
            json={
                "caseId": "case_fallback_review",
                "language": "vi",
                "extractedText": (
                    "This lease agreement is entered into between Landlord A and Tenant B on 2026-04-01. "
                    "The governing law is Vietnamese law. The landlord may terminate at any time at sole discretion. "
                    "A penalty applies if the tenant breaches payment obligations."
                ),
                "metadata": {
                    "documentName": "lease-agreement.pdf",
                    "priority": "high",
                    "submittedBy": "client_123",
                },
            },
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["docType"] in {"rental_contract", "general_contract", "legal_document"}
    assert mock_generate.call_count == 2


def test_legal_review_does_not_retry_when_gemini_hits_quota_limit() -> None:
    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch(
            "app.services.gemini_client.GeminiClient.generate_text",
            side_effect=RuntimeError("429 RESOURCE_EXHAUSTED: quota exceeded"),
        ) as mock_generate,
        patch("app.services.retry_service.time.sleep", return_value=None),
    ):
        response = client.post(
            "/v1/legal/review",
            json={
                "caseId": "case_quota_review",
                "language": "vi",
                "extractedText": "Employment agreement with governing law and termination clause.",
                "metadata": {
                    "documentName": "employment-agreement.pdf",
                    "priority": "medium",
                    "submittedBy": "client_123",
                },
            },
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["meta"]["provider"] == "bootstrap"
    assert mock_generate.call_count == 1
