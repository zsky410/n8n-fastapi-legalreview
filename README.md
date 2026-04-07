# LegalDesk AI Microservice

FastAPI scaffold for the LegalDesk capstone AI microservice.

## Included in this bootstrap

- FastAPI app with `/health` and `/docs`
- Live-ready endpoint for `POST /v1/legal/review`
- Live-ready endpoint for `POST /v1/legal/chat`
- Docker Compose stack with:
  - `api`
  - `nginx`
  - `postgres`
  - `redis`
- Gemini environment configuration
- Unified API error format
- Health dependency checks for Postgres and Redis
- Starter tests

## Quick Start

1. Review `.env` or copy `.env.example` into `.env`.
2. Add `GEMINI_API_KEY` when you are ready to enable live model calls.
3. Start the stack:

```bash
docker compose up -d --build
```

4. Open:

- `http://localhost:8080/health`
- `http://localhost:8080/docs`

## Current bootstrap behavior

- `ENABLE_LLM_CALLS=false` by default.
- When `ENABLE_LLM_CALLS=true` and `GEMINI_API_KEY` is present, `POST /v1/legal/review` and `POST /v1/legal/chat` will use Gemini.
- If Gemini is disabled or returns an invalid payload, the app falls back to deterministic bootstrap logic.
- Parser and retry services are included for Milestone 3.

## Project Structure

```text
app/
  api/routes/
  core/
  prompts/
  schemas/
  services/
tests/
nginx/
docs/
```

## Key docs

- Foundation decisions: `docs/milestone-1-foundation.md`
- API contracts: `docs/api-contracts.md`
- N8N orchestration handoff: `docs/n8n-orchestration.md`
- n8n smoke evidence: `docs/n8n-smoke-evidence.md`

## n8n sample workflows

- Review orchestrator: `n8n/legaldesk-review-fastapi.json`
- Chat orchestrator: `n8n/legaldesk-chat-fastapi.json`

## Run Tests

```bash
docker compose exec -T api python -m pytest -q
```

## Enable live Gemini

```bash
ENABLE_LLM_CALLS=true
GEMINI_API_KEY=your_key_here
```

## First request schema

```json
{
  "caseId": "case_001",
  "language": "vi",
  "extractedText": "Full OCR or extracted contract text goes here...",
  "metadata": {
    "documentName": "lease-agreement.pdf",
    "documentTypeHint": "lease agreement",
    "priority": "high",
    "submittedBy": "client_123",
    "sourceSystem": "n8n",
    "tags": ["demo", "lease"]
  }
}
```
