# Legal Document Review MVP

AI-first, human-on-exception legal document review demo built with FastAPI, Next.js, Postgres, n8n, and Mailhog. Giao diện web dùng tiếng Việt có dấu, còn các thuật ngữ kỹ thuật như AI, audit, callback, MIME, SHA-256, PDF/DOCX và n8n được giữ nguyên khi cần.

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

The backend runs Alembic migrations, seeds demo users, and seeds 8 demo documents on container start. The seeded documents cover `ai_approved`, `pending_admin`, `admin_approved`, `admin_rejected`, `processing`, and `failed` states so the UI, dashboard, audit log, Mailhog/n8n demo, and automation endpoints have useful data immediately.

Day 1 acceptance:

```bash
curl http://localhost:8000/health

TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@example.com","password":"password123"}' | jq -r .access_token)

curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

The backend runs Alembic migrations and seeds demo data on container start.

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

## Day 4 UI

Implemented screens:

- Client: login, document list with status filters, upload, detail, download.
- Admin/reviewer: review queue with scope toggle, document detail, decision form, dashboard, audit logs.
- Shared UI: fixed sidebar on desktop, responsive mobile layout, Vietnamese labels, status badges, empty states, risk badges, and translated audit/risk labels.

Useful URLs:

- Client documents: http://localhost:3000/documents
- Upload: http://localhost:3000/documents/upload
- Admin queue: http://localhost:3000/admin/queue
- Dashboard: http://localhost:3000/admin/dashboard
- Audit logs: http://localhost:3000/admin/audit-logs

## Day 5 Hardening

Seeded demo documents:

| Filename | Expected status | Demo purpose |
| --- | --- | --- |
| `demo-safe-contract.docx` | `ai_approved` | Normal auto-approval. |
| `demo-safe-nda.docx` | `ai_approved` | AI audit sample. |
| `demo-high-value-contract.docx` | `pending_admin` | High-risk human handoff. |
| `demo-expiring-renewal.docx` | `pending_admin` | Expiry alert and renewal risk. |
| `demo-approved-after-review.docx` | `admin_approved` | Admin override/approval trail. |
| `demo-rejected-invoice.docx` | `admin_rejected` | Rejection trail. |
| `demo-processing-upload.docx` | `processing` | In-progress UI state. |
| `demo-failed-extraction.docx` | `failed` | Failed-processing UI state. |

Test commands:

```bash
docker compose build backend frontend
docker compose up -d backend frontend
docker compose exec -T backend env PYTHONPATH=/app pytest
git diff --check
```

Smoke checks:

```bash
CLIENT_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@example.com","password":"password123"}' | jq -r .access_token)

curl -s http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq 'length'

ADMIN_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}' | jq -r .access_token)

curl -s 'http://localhost:8000/api/v1/admin/queue?scope=all' \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq 'length'

curl -s 'http://localhost:8000/api/v1/automation/expiring?days=30' | jq 'length'
```

More final-delivery docs:

- Demo script: [docs/demo-script.md](docs/demo-script.md)
- Slide outline: [docs/slides.md](docs/slides.md)

Screenshots:

| Screen | File |
| --- | --- |
| Login | `docs/screenshots/login.png` |
| Client documents | `docs/screenshots/client-documents.png` |
| Admin queue | `docs/screenshots/admin-queue.png` |
| Admin detail | `docs/screenshots/admin-detail.png` |
| Dashboard | `docs/screenshots/admin-dashboard.png` |
| Audit logs | `docs/screenshots/audit-logs.png` |

## Architecture Responsibilities

| Area | Backend | n8n |
| --- | --- | --- |
| Legal review logic | Extract text, classify, score risk, generate AI/mock summary, choose review status. | No legal decision logic. |
| State | Postgres documents, findings, reviews, audit logs, n8n callback events. | Workflow execution state. |
| Notifications | Sends `document.reviewed` webhook payload. | Routes status, sends Mailhog emails, calls callback endpoint. |
| Compliance monitor | Exposes expiring/audit/summary APIs. | Schedules/manual runs, batches email sends, records callbacks. |

## Demo Script Summary

1. Login as `client@example.com`.
2. Show seeded safe document already `AI đã duyệt`.
3. Upload or open a high-risk document and show `Chờ admin duyệt`.
4. Login as `admin@example.com`, open queue, inspect "Lý do bị gắn cờ".
5. Submit approve/reject with a comment.
6. Open dashboard and audit logs.
7. Open Mailhog to show notification emails.
8. Execute n8n compliance workflow manually and check callback rows.

## Known Limitations

- This is a demo, not legal advice and not production-grade legal accuracy.
- OCR for scanned PDFs is intentionally out of scope.
- Background work uses FastAPI `BackgroundTasks`, not Celery/Redis.
- Files are stored on a local Docker volume, not S3/MinIO.
- OpenAI is optional; without an API key the deterministic mock reviewer is used.
- n8n workflow credentials still need to be selected/imported in the n8n UI for Mailhog email nodes.
