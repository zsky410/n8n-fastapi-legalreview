from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class N8nEventCallback(BaseModel):
    trace_id: str | None = Field(default=None, max_length=255)
    event_type: str = Field(min_length=1, max_length=120)
    status: str = Field(min_length=1, max_length=40)
    payload: dict[str, Any] = Field(default_factory=dict)


class N8nEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trace_id: str | None
    event_type: str
    direction: str
    payload: dict[str, Any]
    status: str
    created_at: datetime
