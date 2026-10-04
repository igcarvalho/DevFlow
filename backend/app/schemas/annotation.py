import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.annotation import AnnotationType


class AnnotationCreate(BaseModel):
    version_id: uuid.UUID
    page_number: int = 1
    type: AnnotationType = AnnotationType.note
    content: str
    position: dict[str, Any] | None = None


class AnnotationUpdate(BaseModel):
    content: str | None = None
    type: AnnotationType | None = None
    page_number: int | None = None
    position: dict[str, Any] | None = None


class AnnotationRead(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version_id: uuid.UUID
    page_number: int
    type: AnnotationType
    content: str
    position: dict[str, Any] | None = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    author_name: str | None = None

    class Config:
        from_attributes = True
