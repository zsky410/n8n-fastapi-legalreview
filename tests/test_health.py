from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "ok"
    assert payload["service"] == "LegalDesk AI Microservice"
    assert "timestamp" in payload
    assert "dependencies" in payload
    assert "postgres" in payload["dependencies"]
    assert "redis" in payload["dependencies"]
    assert payload["dependencies"]["postgres"]["status"] in {"connected", "unavailable"}
    assert payload["dependencies"]["redis"]["status"] in {"connected", "unavailable"}
