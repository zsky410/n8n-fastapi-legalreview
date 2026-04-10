from dataclasses import dataclass

import psycopg
from psycopg.rows import dict_row

from app.core.config import Settings, get_settings


@dataclass(slots=True)
class UserRecord:
    id: str
    email: str
    password_hash: str
    name: str
    company: str | None
    role: str
    created_at: object


class DuplicateEmailError(ValueError):
    pass


class UserRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def ensure_schema(self) -> None:
        with psycopg.connect(self.settings.database_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id UUID PRIMARY KEY,
                        email TEXT NOT NULL UNIQUE,
                        password_hash TEXT NOT NULL,
                        name TEXT NOT NULL,
                        company TEXT,
                        role TEXT NOT NULL DEFAULT 'client',
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        CONSTRAINT users_role_check CHECK (role IN ('client', 'admin'))
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS users_role_idx
                    ON users (role)
                    """
                )
            conn.commit()

    def get_user_by_email(self, email: str) -> UserRecord | None:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                SELECT id, email, password_hash, name, company, role, created_at
                FROM users
                WHERE email = %(email)s
                LIMIT 1
                """,
                {"email": email},
            ).fetchone()

        return self._to_record(row)

    def get_user_by_id(self, user_id: str) -> UserRecord | None:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                SELECT id, email, password_hash, name, company, role, created_at
                FROM users
                WHERE id = %(user_id)s
                LIMIT 1
                """,
                {"user_id": user_id},
            ).fetchone()

        return self._to_record(row)

    def create_user(
        self,
        *,
        user_id: str,
        email: str,
        password_hash: str,
        name: str,
        company: str | None,
        role: str = "client",
    ) -> UserRecord:
        try:
            with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
                row = conn.execute(
                    """
                    INSERT INTO users (id, email, password_hash, name, company, role)
                    VALUES (%(user_id)s, %(email)s, %(password_hash)s, %(name)s, %(company)s, %(role)s)
                    RETURNING id, email, password_hash, name, company, role, created_at
                    """,
                    {
                        "user_id": user_id,
                        "email": email,
                        "password_hash": password_hash,
                        "name": name,
                        "company": company,
                        "role": role,
                    },
                ).fetchone()
                conn.commit()
        except psycopg.errors.UniqueViolation as exc:
            raise DuplicateEmailError("Email đã tồn tại.") from exc

        user = self._to_record(row)
        if not user:
            raise RuntimeError("Không thể tạo người dùng mới.")

        return user

    @staticmethod
    def _to_record(row: dict | None) -> UserRecord | None:
        if not row:
            return None

        return UserRecord(
            id=str(row["id"]),
            email=str(row["email"]),
            password_hash=str(row["password_hash"]),
            name=str(row["name"]),
            company=row["company"],
            role=str(row["role"]),
            created_at=row["created_at"],
        )
