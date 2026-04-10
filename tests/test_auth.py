import os
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.api.routes.auth import get_auth_service
from app.core.config import Settings
from app.main import app
from app.services.auth_service import AuthService


def resolve_test_database_url() -> str | None:
    candidates = [
        os.getenv("AUTH_TEST_DATABASE_URL"),
        "postgresql://legaldesk:legaldesk@postgres:5432/legaldesk_ai",
        "postgresql://legaldesk:legaldesk@localhost:5433/legaldesk_ai",
    ]

    for candidate in candidates:
        if not candidate:
            continue
        try:
            with psycopg.connect(candidate, connect_timeout=1):
                return candidate
        except psycopg.Error:
            continue

    return None


TEST_DATABASE_URL = resolve_test_database_url()
pytestmark = pytest.mark.skipif(TEST_DATABASE_URL is None, reason="Không có Postgres test database khả dụng.")
client = TestClient(app)


def cleanup_users(database_url: str, *emails: str) -> None:
    if not emails:
        return

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE email = ANY(%s)", (list(emails),))
        conn.commit()


@pytest.fixture()
def auth_service() -> AuthService:
    settings = Settings(
        database_url=TEST_DATABASE_URL,
        auth_jwt_secret="test-auth-secret",
        auth_access_token_minutes=60,
    )
    service = AuthService(settings)
    service.ensure_schema()
    app.dependency_overrides[get_auth_service] = lambda: service
    yield service
    app.dependency_overrides.clear()


def test_client_can_register_and_fetch_profile(auth_service: AuthService) -> None:
    email = f"client-{uuid.uuid4().hex[:8]}@example.com"
    cleanup_users(auth_service.settings.database_url, email)

    register_response = client.post(
        "/v1/auth/register",
        json={
            "email": email,
            "password": "MatKhau#123",
            "name": "Nguyen Minh An",
            "company": "Cong ty TNHH Demo",
        },
    )

    assert register_response.status_code == 200
    register_payload = register_response.json()

    assert register_payload["tokenType"] == "bearer"
    assert register_payload["user"]["email"] == email
    assert register_payload["user"]["role"] == "client"
    assert register_payload["accessToken"]

    me_response = client.get(
        "/v1/auth/me",
        headers={"Authorization": f"Bearer {register_payload['accessToken']}"},
    )

    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["email"] == email
    assert me_payload["name"] == "Nguyen Minh An"

    cleanup_users(auth_service.settings.database_url, email)


def test_client_login_returns_access_token(auth_service: AuthService) -> None:
    email = f"login-{uuid.uuid4().hex[:8]}@example.com"
    cleanup_users(auth_service.settings.database_url, email)

    client.post(
        "/v1/auth/register",
        json={
            "email": email,
            "password": "MatKhau#456",
            "name": "Tran Thi B",
            "company": "Van phong B",
        },
    )

    login_response = client.post(
        "/v1/auth/login",
        json={
            "email": email,
            "password": "MatKhau#456",
        },
    )

    assert login_response.status_code == 200
    payload = login_response.json()
    assert payload["user"]["email"] == email
    assert payload["accessToken"]

    cleanup_users(auth_service.settings.database_url, email)


def test_register_rejects_reserved_admin_demo_email(auth_service: AuthService) -> None:
    response = client.post(
        "/v1/auth/register",
        json={
            "email": "admin@demo.vn",
            "password": "MatKhau#789",
            "name": "Admin Demo",
            "company": "LegalDesk AI",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["message"] == "Email này đang dành cho tài khoản quản trị demo."
