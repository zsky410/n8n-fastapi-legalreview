import uuid
from dataclasses import dataclass
from datetime import datetime

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.core.config import Settings, get_settings


@dataclass(slots=True)
class StoredCaseRecord:
    id: str
    owner_user_id: str
    title: str
    document_name: str
    description: str
    domain: str
    priority: str
    status: str
    risk_level: str
    needs_attention: bool
    created_at: datetime
    updated_at: datetime
    extracted_text: str
    attachments: list[dict]
    sla_due_at: datetime | None
    review_json: dict | None
    chat_messages: list[dict]


class ClientCaseRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def ensure_schema(self) -> None:
        with psycopg.connect(self.settings.database_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS client_cases (
                        id TEXT PRIMARY KEY,
                        owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title TEXT NOT NULL,
                        document_name TEXT NOT NULL,
                        description TEXT NOT NULL DEFAULT '',
                        domain TEXT NOT NULL DEFAULT '',
                        priority TEXT NOT NULL DEFAULT 'medium',
                        status TEXT NOT NULL DEFAULT 'uploaded',
                        risk_level TEXT NOT NULL DEFAULT 'medium',
                        needs_attention BOOLEAN NOT NULL DEFAULT FALSE,
                        extracted_text TEXT NOT NULL DEFAULT '',
                        attachments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                        sla_due_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        CONSTRAINT client_cases_priority_check CHECK (priority IN ('low', 'medium', 'high')),
                        CONSTRAINT client_cases_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high'))
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS case_reviews (
                        id UUID PRIMARY KEY,
                        case_id TEXT NOT NULL UNIQUE REFERENCES client_cases(id) ON DELETE CASCADE,
                        review_json JSONB NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS client_cases_owner_created_idx
                    ON client_cases (owner_user_id, created_at DESC)
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS case_chat_messages (
                        id UUID PRIMARY KEY,
                        case_id TEXT NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        citations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                        caution TEXT,
                        confidence DOUBLE PRECISION,
                        disclaimer TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        CONSTRAINT case_chat_messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS case_chat_messages_case_created_idx
                    ON case_chat_messages (case_id, created_at ASC)
                    """
                )
            conn.commit()

    def list_cases(self, owner_user_id: str) -> list[StoredCaseRecord]:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            rows = conn.execute(
                """
                SELECT
                    c.id,
                    c.owner_user_id,
                    c.title,
                    c.document_name,
                    c.description,
                    c.domain,
                    c.priority,
                    c.status,
                    c.risk_level,
                    c.needs_attention,
                    c.created_at,
                    c.updated_at,
                    c.extracted_text,
                    c.attachments_json,
                    c.sla_due_at,
                    r.review_json
                FROM client_cases c
                LEFT JOIN case_reviews r ON r.case_id = c.id
                WHERE c.owner_user_id = %(owner_user_id)s
                ORDER BY c.created_at DESC
                """,
                {"owner_user_id": owner_user_id},
            ).fetchall()

        return [self._to_record(row, self.list_chat_messages(str(row["id"]))) for row in rows]

    def get_case(self, owner_user_id: str, case_id: str) -> StoredCaseRecord | None:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                SELECT
                    c.id,
                    c.owner_user_id,
                    c.title,
                    c.document_name,
                    c.description,
                    c.domain,
                    c.priority,
                    c.status,
                    c.risk_level,
                    c.needs_attention,
                    c.created_at,
                    c.updated_at,
                    c.extracted_text,
                    c.attachments_json,
                    c.sla_due_at,
                    r.review_json
                FROM client_cases c
                LEFT JOIN case_reviews r ON r.case_id = c.id
                WHERE c.owner_user_id = %(owner_user_id)s AND c.id = %(case_id)s
                LIMIT 1
                """,
                {"owner_user_id": owner_user_id, "case_id": case_id},
            ).fetchone()

        return self._to_record(row, self.list_chat_messages(case_id)) if row else None

    def get_case_by_id(self, case_id: str) -> StoredCaseRecord | None:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                SELECT
                    c.id,
                    c.owner_user_id,
                    c.title,
                    c.document_name,
                    c.description,
                    c.domain,
                    c.priority,
                    c.status,
                    c.risk_level,
                    c.needs_attention,
                    c.created_at,
                    c.updated_at,
                    c.extracted_text,
                    c.attachments_json,
                    c.sla_due_at,
                    r.review_json
                FROM client_cases c
                LEFT JOIN case_reviews r ON r.case_id = c.id
                WHERE c.id = %(case_id)s
                LIMIT 1
                """,
                {"case_id": case_id},
            ).fetchone()

        return self._to_record(row, self.list_chat_messages(case_id)) if row else None

    def create_case(
        self,
        *,
        owner_user_id: str,
        case_id: str,
        title: str,
        document_name: str,
        description: str,
        domain: str,
        priority: str,
        extracted_text: str,
        attachments: list[dict],
        sla_due_at: datetime | None,
    ) -> StoredCaseRecord:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                INSERT INTO client_cases (
                    id,
                    owner_user_id,
                    title,
                    document_name,
                    description,
                    domain,
                    priority,
                    extracted_text,
                    attachments_json,
                    sla_due_at
                )
                VALUES (
                    %(case_id)s,
                    %(owner_user_id)s,
                    %(title)s,
                    %(document_name)s,
                    %(description)s,
                    %(domain)s,
                    %(priority)s,
                    %(extracted_text)s,
                    %(attachments_json)s,
                    %(sla_due_at)s
                )
                RETURNING
                    id,
                    owner_user_id,
                    title,
                    document_name,
                    description,
                    domain,
                    priority,
                    status,
                    risk_level,
                    needs_attention,
                    created_at,
                    updated_at,
                    extracted_text,
                    attachments_json,
                    sla_due_at
                """,
                {
                    "case_id": case_id,
                    "owner_user_id": owner_user_id,
                    "title": title,
                    "document_name": document_name,
                    "description": description,
                    "domain": domain,
                    "priority": priority,
                    "extracted_text": extracted_text,
                    "attachments_json": Jsonb(attachments),
                    "sla_due_at": sla_due_at,
                },
            ).fetchone()
            conn.commit()

        return self._to_record({**row, "review_json": None}, [])

    def upsert_review(
        self,
        *,
        owner_user_id: str,
        case_id: str,
        review_json: dict,
        risk_level: str,
        needs_attention: bool,
    ) -> StoredCaseRecord | None:
        review_id = str(uuid.uuid4())
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            updated_case = conn.execute(
                """
                UPDATE client_cases
                SET
                    status = 'auto_published',
                    risk_level = %(risk_level)s,
                    needs_attention = %(needs_attention)s,
                    updated_at = NOW()
                WHERE owner_user_id = %(owner_user_id)s AND id = %(case_id)s
                RETURNING
                    id,
                    owner_user_id,
                    title,
                    document_name,
                    description,
                    domain,
                    priority,
                    status,
                    risk_level,
                    needs_attention,
                    created_at,
                    updated_at,
                    extracted_text,
                    attachments_json,
                    sla_due_at
                """,
                {
                    "risk_level": risk_level,
                    "needs_attention": needs_attention,
                    "owner_user_id": owner_user_id,
                    "case_id": case_id,
                },
            ).fetchone()

            if not updated_case:
                conn.rollback()
                return None

            conn.execute(
                """
                INSERT INTO case_reviews (id, case_id, review_json)
                VALUES (%(review_id)s, %(case_id)s, %(review_json)s)
                ON CONFLICT (case_id)
                DO UPDATE SET
                    review_json = EXCLUDED.review_json,
                    updated_at = NOW()
                """,
                {
                    "review_id": review_id,
                    "case_id": case_id,
                    "review_json": Jsonb(review_json),
                },
            )
            conn.commit()

        return self.get_case(owner_user_id, case_id)

    def list_chat_messages(self, case_id: str) -> list[dict]:
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            rows = conn.execute(
                """
                SELECT id, role, content, citations_json, caution, confidence, disclaimer, created_at
                FROM case_chat_messages
                WHERE case_id = %(case_id)s
                ORDER BY created_at ASC, id ASC
                """,
                {"case_id": case_id},
            ).fetchall()

        return [
            {
                "id": str(row["id"]),
                "role": str(row["role"]),
                "content": str(row["content"]),
                "createdAt": row["created_at"].isoformat(),
                "citations": list(row["citations_json"] or []),
                "caution": row["caution"],
                "confidence": row["confidence"],
                "disclaimer": row["disclaimer"],
            }
            for row in rows
        ]

    def append_chat_message(
        self,
        *,
        case_id: str,
        role: str,
        content: str,
        citations: list[dict] | None = None,
        caution: str | None = None,
        confidence: float | None = None,
        disclaimer: str | None = None,
    ) -> dict:
        message_id = str(uuid.uuid4())
        with psycopg.connect(self.settings.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                INSERT INTO case_chat_messages (
                    id,
                    case_id,
                    role,
                    content,
                    citations_json,
                    caution,
                    confidence,
                    disclaimer
                )
                VALUES (
                    %(message_id)s,
                    %(case_id)s,
                    %(role)s,
                    %(content)s,
                    %(citations_json)s,
                    %(caution)s,
                    %(confidence)s,
                    %(disclaimer)s
                )
                RETURNING id, role, content, citations_json, caution, confidence, disclaimer, created_at
                """,
                {
                    "message_id": message_id,
                    "case_id": case_id,
                    "role": role,
                    "content": content,
                    "citations_json": Jsonb(citations or []),
                    "caution": caution,
                    "confidence": confidence,
                    "disclaimer": disclaimer,
                },
            ).fetchone()
            conn.commit()

        return {
            "id": str(row["id"]),
            "role": str(row["role"]),
            "content": str(row["content"]),
            "createdAt": row["created_at"].isoformat(),
            "citations": list(row["citations_json"] or []),
            "caution": row["caution"],
            "confidence": row["confidence"],
            "disclaimer": row["disclaimer"],
        }

    @staticmethod
    def _to_record(row: dict, chat_messages: list[dict]) -> StoredCaseRecord:
        return StoredCaseRecord(
            id=str(row["id"]),
            owner_user_id=str(row["owner_user_id"]),
            title=str(row["title"]),
            document_name=str(row["document_name"]),
            description=str(row["description"] or ""),
            domain=str(row["domain"] or ""),
            priority=str(row["priority"]),
            status=str(row["status"]),
            risk_level=str(row["risk_level"]),
            needs_attention=bool(row["needs_attention"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            extracted_text=str(row["extracted_text"] or ""),
            attachments=list(row["attachments_json"] or []),
            sla_due_at=row["sla_due_at"],
            review_json=row.get("review_json"),
            chat_messages=chat_messages,
        )
