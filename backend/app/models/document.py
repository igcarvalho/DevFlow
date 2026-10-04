import enum

from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Document(Base):
    __tablename__ = "documents"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    current_version_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.pending)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        foreign_keys="DocumentVersion.document_id",
        order_by="DocumentVersion.version_number",
    )


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_key = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    extracted_text = Column(Text, nullable=True)
    processing_error = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    document = relationship(
        "Document",
        back_populates="versions",
        foreign_keys=[document_id],
    )
