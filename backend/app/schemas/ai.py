import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.ai_job import AiJobStatus, AiJobType


class SummarizeRequest(BaseModel):
    document_id: uuid.UUID


class AskRequest(BaseModel):
    document_id: uuid.UUID
    question: str


class SuggestTasksRequest(BaseModel):
    pass


class AiJobRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    type: AiJobType
    status: AiJobStatus
    input_data: dict[str, Any]
    result: dict[str, Any] | None = None
    error_message: str | None = None
    created_by: uuid.UUID
    created_at: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True
