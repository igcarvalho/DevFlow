import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import JsonType


class AiJobType(str, enum.Enum):
    summarize = "summarize"
    ask = "ask"
    suggest_tasks = "suggest_tasks"


class AiJobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class AiJob(Base):
    __tablename__ = "ai_jobs"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    type = Column(Enum(AiJobType), nullable=False)
    input_data = Column(JsonType, nullable=False, default=dict)
    result = Column(JsonType, nullable=True)
    status = Column(Enum(AiJobStatus), nullable=False, default=AiJobStatus.pending)
    error_message = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project")
