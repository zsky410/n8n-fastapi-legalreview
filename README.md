# Legal Document Review MVP

AI-first, human-on-exception legal document review demo built with FastAPI, Next.js, Postgres, n8n, and Mailhog.

## Quickstart

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- n8n: http://localhost:5678
- Mailhog: http://localhost:8025

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Client | client@example.com | password123 |
| Reviewer | reviewer@example.com | password123 |
| Admin | admin@example.com | password123 |

Day 1 acceptance:

```bash
curl http://localhost:8000/health

TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@example.com","password":"password123"}' | jq -r .access_token)

curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

The backend runs Alembic migrations and seeds demo users on container start.

## Day 2 APIs

The backend now supports:

- `POST /api/v1/documents` for PDF and DOCX upload
- `GET /api/v1/documents` for a user's document list
- `GET /api/v1/documents/{id}` for detail, summary, and findings
- `GET /api/v1/documents/{id}/download` for file download

Day 2 acceptance:

1. Upload one low-risk DOCX or PDF and confirm it becomes `ai_approved`.
2. Upload one risky DOCX or PDF and confirm it becomes `pending_admin`.
3. Confirm `GET /api/v1/documents/{id}` includes `risk_findings`, `summary`, `classification`, and `flag_reasons`.
4. Confirm `n8n_events` records outbound webhook attempts even if no workflow exists yet.
