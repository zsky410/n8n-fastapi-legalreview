from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_validation_error_uses_unified_format() -> None:
    response = client.post(
        "/v1/legal/review",
        json={
            "caseId": "case_001",
        },
    )

    assert response.status_code == 422

    payload = response.json()

    assert payload["error"] == "validation_error"
    assert payload["message"] == "Request validation failed."
    assert isinstance(payload["details"], list)
    assert payload["requestId"]
    assert "X-Request-ID" in response.headers
