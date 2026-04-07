# API Contracts

This document freezes the first public API contracts used by the LegalDesk AI microservice bootstrap.

## `GET /health`

Purpose:
- service liveness for Docker and reverse proxy
- dependency visibility for Postgres and Redis

Response shape:

```json
{
  "status": "ok",
  "service": "LegalDesk AI Microservice",
  "environment": "development",
  "timestamp": "2026-04-07T18:09:07.399364+00:00",
  "dependencies": {
    "postgres": {
      "status": "connected",
      "detail": null
    },
    "redis": {
      "status": "connected",
      "detail": null
    }
  }
}
```

## `POST /v1/legal/review`

Request shape:

```json
{
  "caseId": "case_001",
  "language": "vi",
  "extractedText": "Full OCR or extracted legal text...",
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

Response shape:

```json
{
  "caseId": "case_001",
  "docType": "lease agreement",
  "confidence": 0.61,
  "riskScore": 35,
  "riskLevel": "low",
  "riskFlags": [
    {
      "code": "penalty_clause",
      "label": "Penalty or liquidated damages clause detected",
      "severity": "medium",
      "excerpt": "Penalty-related wording appears in the extracted text.",
      "rationale": "Penalty clauses should be reviewed for proportionality and enforceability."
    }
  ],
  "extractedFields": {
    "effectiveDate": "2026-04-01",
    "governingLaw": "Vietnamese law",
    "parties": ["Landlord A", "Tenant B"]
  },
  "recommendedAction": "auto_publish",
  "summary": "Tai lieu duoc nhan dang la lease agreement voi muc rui ro low.",
  "needsAttention": false,
  "qualityWarning": true,
  "disclaimer": "Ket qua AI chi co gia tri tham khao, khong thay the tu van phap ly chuyen nghiep.",
  "meta": {
    "requestId": "uuid",
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "processingMs": 10
  }
}
```

## `POST /v1/legal/chat`

This endpoint is available in Milestone 3 with Gemini live mode plus bootstrap fallback.

Request shape:

```json
{
  "caseId": "case_001",
  "question": "Hop dong nay co dieu khoan nao can xem lai khong?",
  "language": "vi",
  "conversationContext": [
    {
      "role": "user",
      "content": "Hay tom tat hop dong nay cho toi."
    },
    {
      "role": "assistant",
      "content": "Day la hop dong thue tai san..."
    }
  ]
}
```

Response shape:

```json
{
  "caseId": "case_001",
  "answer": "Can xem lai dieu khoan phat va quyen cham dut don phuong.",
  "citations": [
    {
      "excerpt": "The late payment penalty is 25%.",
      "source": "document_text",
      "rationale": "This clause may be disproportionate."
    }
  ],
  "caution": "Can doi chieu voi ban goc va ngu canh ho so.",
  "confidence": 0.74,
  "needsAttention": false,
  "disclaimer": "Ket qua AI chi co gia tri tham khao, khong thay the tu van phap ly chuyen nghiep."
}
```

## Unified error format

Validation and HTTP errors should be normalized to the same envelope.

```json
{
  "error": "validation_error",
  "message": "Request validation failed.",
  "details": [
    {
      "code": "missing",
      "message": "Field required",
      "field": "metadata"
    }
  ],
  "requestId": "uuid"
}
```
