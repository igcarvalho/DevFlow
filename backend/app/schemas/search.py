import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentSearchResult(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    status: str
    created_at: datetime
    snippet: str | None = None
    version_id: uuid.UUID | None = None


class MessageSearchResult(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    content: str
    sender_id: uuid.UUID
    sender_name: str | None = None
    created_at: datetime
    snippet: str | None = None


class SearchResponse(BaseModel):
    query: str
    documents: list[DocumentSearchResult] = []
    messages: list[MessageSearchResult] = []
    total: int = 0
