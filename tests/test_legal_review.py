from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_legal_review_returns_bootstrap_analysis() -> None:
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
    assert payload["meta"]["provider"] == "gemini"

