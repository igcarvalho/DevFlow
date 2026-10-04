import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import (  # noqa: F401
    AiJob,
    AiJobStatus,
    AiJobType,
    Document,
    DocumentVersion,
    Message,
    Chat,
)
from app.services import ai as ai_service
from app.tasks.celery_app import celery_app


def _get_context_text(db: Session, project_id: uuid.UUID, input_data: dict) -> tuple[str, str]:
    """Returns (title, text) for the job context."""
    document_id = input_data.get("document_id")
    if document_id:
        version = (
            db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == uuid.UUID(document_id))
            .order_by(DocumentVersion.version_number.desc())
            .first()
        )
        document = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
        title = document.title if document else "Documento"
        text = version.extracted_text if version and version.extracted_text else ""
        return title, text

    # chat context
    chat = db.query(Chat).filter(Chat.project_id == project_id).first()
    if chat is None:
        return "Conversa do projeto", ""
    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat.id, Message.deleted_at.is_(None))
        .order_by(Message.created_at.asc())
        .limit(100)
        .all()
    )
    lines = []
    for message in messages:
        sender = message.sender.full_name if message.sender else "Usuário"
        lines.append(f"{sender}: {message.content}")
    return "Conversa do projeto", "\n".join(lines)


@celery_app.task(bind=True, name="app.tasks.ai.process_ai_job")
def process_ai_job(self, job_id: str) -> dict:
    db: Session = SessionLocal()
    try:
        job = db.query(AiJob).filter(AiJob.id == uuid.UUID(job_id)).first()
        if job is None:
            return {"status": "error", "message": "Job not found"}

        job.status = AiJobStatus.processing
        db.commit()

        try:
            title, text = _get_context_text(db, job.project_id, job.input_data or {})

            if job.type == AiJobType.summarize:
                result = {"summary": ai_service.summarize_document(title, text)}
            elif job.type == AiJobType.ask:
                question = (job.input_data or {}).get("question", "")
                result = {"answer": ai_service.answer_question(title, text, question)}
            elif job.type == AiJobType.suggest_tasks:
                result = {"tasks": ai_service.suggest_tasks(text)}
            else:
                raise ValueError(f"Unsupported job type: {job.type}")

            job.result = result
            job.status = AiJobStatus.completed
            job.completed_at = datetime.utcnow()
            job.error_message = None
            db.commit()
            return {"status": "completed", "job_id": job_id}
        except Exception as e:
            job.status = AiJobStatus.failed
            job.error_message = str(e)
            db.commit()
            return {"status": "failed", "job_id": job_id, "error": str(e)}
    finally:
        db.close()
