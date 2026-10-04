import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.issue import IssuePriority, IssueStatus


class IssueCreate(BaseModel):
    title: str
    description: str | None = None
    status: IssueStatus = IssueStatus.backlog
    priority: IssuePriority = IssuePriority.medium
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None
    document_id: uuid.UUID | None = None
    message_id: uuid.UUID | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None


class IssueRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None = None
    status: IssueStatus
    priority: IssuePriority
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None
    document_id: uuid.UUID | None = None
    message_id: uuid.UUID | None = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    assignee_name: str | None = None

    class Config:
        from_attributes = True
