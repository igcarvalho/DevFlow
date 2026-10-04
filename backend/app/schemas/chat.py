import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str
    reply_to_id: uuid.UUID | None = None


class MessageRead(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    reply_to_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    sender_name: str | None = None
    sender_email: str | None = None

    class Config:
        from_attributes = True


class ChatRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
