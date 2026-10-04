import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentVersionRead(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    file_key: str
    file_size: int
    mime_type: str
    extracted_text: str | None = None
    processing_error: str | None = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None = None
    current_version_id: uuid.UUID | None = None
    mime_type: str | None = None
    status: DocumentStatus
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentReadWithVersions(DocumentRead):
    versions: list[DocumentVersionRead] = []


class DocumentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
