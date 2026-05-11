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

## Day 3 n8n Workflows

Workflow JSON files are in `n8n/workflows`:

- `document-result-router.json`: receives `document.reviewed`, routes by `review_status`, sends Mailhog email, then calls back to FastAPI.
- `compliance-monitor-audit.json`: manual/scheduled expiry alerts, AI auto-approval audit sample, weekly summary, and callback logging.

Mailhog SMTP credential example: `n8n/credentials/mailhog-smtp.example.json`.

Backend automation endpoints:

- `POST /api/v1/webhooks/n8n-events`
- `GET /api/v1/automation/expiring?days=7`
- `GET /api/v1/automation/audit-sample?limit=5`
- `GET /api/v1/automation/weekly-summary`

### Import workflows

1. Start the stack:

```bash
docker compose up --build
```

2. Open n8n at http://localhost:5678.
3. Import `n8n/workflows/document-result-router.json`.
4. Import `n8n/workflows/compliance-monitor-audit.json`.
5. In n8n, create an SMTP credential named `Mailhog SMTP`, or import `n8n/credentials/mailhog-smtp.example.json`:

| Field | Value |
| --- | --- |
| Host | `mailhog` |
| Port | `1025` |
| Secure | off |
| User | leave empty |
| Password | leave empty |

6. Open every Email Send node and select the `Mailhog SMTP` credential if n8n does not auto-map it.
7. Activate `document-result-router` so FastAPI can call `http://n8n:5678/webhook/document-reviewed`.
8. Run `compliance-monitor-audit` manually for demo, or leave schedules enabled.

When running n8n outside Docker, change workflow HTTP URLs from `http://backend:8000` to `http://localhost:8000`, and SMTP host from `mailhog` to `localhost`.

### Pattern map

| Pattern | Workflow usage |
| --- | --- |
| Webhook Processing | Workflow A receives `document.reviewed` from FastAPI. |
| HTTP API Integration | n8n calls FastAPI callback and automation APIs. |
| IF/Switch | Workflow A routes `ai_approved`, `pending_admin`, and admin decisions. |
| Scheduled Tasks | Workflow B daily expiry and weekly audit/summary triggers. |
| Batch Processing | Workflow B sends expiry emails one at a time. |
| Error/No-data Handling | Invalid, unknown, and no-data branches callback to FastAPI. |
| Human Handoff | `pending_admin` email goes to reviewer/admin. |

### Day 3 smoke tests

Callback endpoint:

```bash
curl -s http://localhost:8000/api/v1/webhooks/n8n-events \
  -H 'Content-Type: application/json' \
  -d '{
    "trace_id": "manual-day3-test",
    "event_type": "notification.sent",
    "status": "success",
    "payload": {
      "workflow": "document-result-router",
      "channels": ["email"],
      "document_id": "manual"
    }
  }'
```

Workflow A:

1. Upload a low-risk document as `client@example.com`; Mailhog should receive an AI-approved email for the client.
2. Upload a risky document; Mailhog should receive a reviewer email, plus a critical admin email if `risk_score >= 85`.
3. Check callback rows:

```bash
docker compose exec postgres psql -U legalreview -d legalreview \
  -c "select trace_id, event_type, direction, status, created_at from n8n_events order by created_at desc limit 10;"
```

Workflow B:

1. Open `compliance-monitor-audit` in n8n.
2. Click `Execute workflow`.
3. Mailhog should show expiry/audit/summary emails when matching data exists.
4. If there is no matching data, FastAPI still records `no_data` callbacks.
