import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import JsonType


class AnnotationType(str, enum.Enum):
    note = "note"
    highlight = "highlight"
    comment = "comment"


class Annotation(Base):
    __tablename__ = "annotations"

    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    version_id = Column(
        UUID(as_uuid=True), ForeignKey("document_versions.id"), nullable=False
    )
    page_number = Column(Integer, nullable=False, default=1)
    type = Column(Enum(AnnotationType), nullable=False, default=AnnotationType.note)
    content = Column(Text, nullable=False)
    position = Column(JsonType, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    author = relationship("User")
