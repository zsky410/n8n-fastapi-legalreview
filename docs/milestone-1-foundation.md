# Milestone 1 Foundation

This document captures the core foundation decisions before deeper AI implementation.

## MVP scope freeze

- `Client` can create a case, upload legal documents, view AI review, open case chat, and track timeline status.
- `Admin` can inspect queues, configure routing thresholds, review audit logs, and manage user access.
- The defense scope is a thin end-to-end slice:
  - upload
  - OCR/text-ready input
  - AI review
  - timeline update
  - case chat
  - admin routing visibility
- Pricing, subscriptions, and paywall logic are outside the defense scope.

## Roles

- `Client`
- `Admin`

## Core entities

- `Case`
- `Document`
- `AnalysisResult`
- `ChatMessage`
- `TimelineEvent`
- `User`

## Case statuses

- `Uploaded`
- `TextExtractOrOCR`
- `AIAnalyzing`
- `AutoPublished`
- `NeedReanalysis`
- `Finalized`

## SLA fields

- `submittedAt`
- `slaTargetAt`
- `slaStatus`
- `escalationLevel`
- `assignedQueue`
- `lastEscalatedAt`

## IA and navigation freeze

### Client app shell

- `Dashboard`
- `Create Case`
- `Case Detail`
- `Documents`
- `AI Review`
- `Chat`
- `Timeline`

### Admin app shell

- `Operations Dashboard`
- `Case Queue`
- `Routing Rules`
- `Audit Logs`
- `Users and Roles`
- `System Health`

## First microservice contract

- `GET /health`
- `POST /v1/legal/review`

## First response fields for legal review

- `docType`
- `confidence`
- `riskScore`
- `riskLevel`
- `riskFlags`
- `extractedFields`
- `recommendedAction`
- `summary`
- `needsAttention`
- `qualityWarning`
