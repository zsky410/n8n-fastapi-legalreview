# LegalDesk AI Microservice

FastAPI scaffold for the LegalDesk capstone AI microservice.

## Included in this bootstrap

- FastAPI app with `/health` and `/docs`
- First schema and stub endpoint for `POST /v1/legal/review`
- First schema set for `POST /v1/legal/chat`
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
- The `POST /v1/legal/review` endpoint currently returns a deterministic heuristic analysis so the stack is usable before Milestone 3.
- A Gemini client wrapper is already prepared for the AI Core milestone.
- `POST /v1/legal/chat` is documented at schema/contract level but not implemented yet.

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

## Run Tests

```bash
docker compose exec -T api python -m pytest -q
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
