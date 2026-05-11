from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.n8n_event import N8nEvent
from app.schemas.webhook import N8nEventCallback, N8nEventRead
from app.services.audit import create_audit_log

router = APIRouter()


@router.post("/n8n-events", response_model=N8nEventRead, status_code=status.HTTP_201_CREATED)
def record_n8n_event(
    payload: N8nEventCallback,
    db: Session = Depends(get_db),
) -> N8nEventRead:
    event = N8nEvent(
        trace_id=payload.trace_id,
        event_type=payload.event_type,
        direction="inbound",
        payload=payload.payload,
        status=payload.status,
    )
    db.add(event)
    db.flush()
    create_audit_log(
        db,
        action="n8n.callback.received",
        target_type="n8n_event",
        target_id=event.id,
        payload={
            "trace_id": payload.trace_id,
            "event_type": payload.event_type,
            "status": payload.status,
            "workflow": payload.payload.get("workflow"),
        },
    )
    db.commit()
    db.refresh(event)
    return N8nEventRead.model_validate(event)
