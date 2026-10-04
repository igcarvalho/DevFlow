import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_project_member
from app.db.session import get_db
from app.models.ai_job import AiJob, AiJobStatus, AiJobType
from app.models.document import Document
from app.models.project import ProjectMember
from app.models.user import User
from app.schemas.ai import AiJobRead, AskRequest, SummarizeRequest
from app.tasks.ai import process_ai_job

router = APIRouter(prefix="/projects/{project_id}/ai", tags=["ai"])


def _ensure_configured() -> None:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recurso de IA indisponível: OPENAI_API_KEY não configurada.",
        )


def _ensure_document(db: Session, project_id: uuid.UUID, document_id: uuid.UUID) -> Document:
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.project_id == project_id,
            Document.deleted_at.is_(None),
        )
        .first()
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


def _create_job(
    db: Session,
    project_id: uuid.UUID,
    user: User,
    job_type: AiJobType,
    input_data: dict,
) -> AiJob:
    job = AiJob(
        project_id=project_id,
        type=job_type,
        input_data=input_data,
        status=AiJobStatus.pending,
        created_by=user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    process_ai_job.delay(str(job.id))
    return job


@router.post("/summarize", response_model=AiJobRead, status_code=status.HTTP_202_ACCEPTED)
def summarize_document(
    project_id: uuid.UUID,
    request: SummarizeRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_configured()
    _ensure_document(db, project_id, request.document_id)
    return _create_job(
        db,
        project_id,
        current_user,
        AiJobType.summarize,
        {"document_id": str(request.document_id)},
    )


@router.post("/ask", response_model=AiJobRead, status_code=status.HTTP_202_ACCEPTED)
def ask_document(
    project_id: uuid.UUID,
    request: AskRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_configured()
    _ensure_document(db, project_id, request.document_id)
    return _create_job(
        db,
        project_id,
        current_user,
        AiJobType.ask,
        {
            "document_id": str(request.document_id),
            "question": request.question,
        },
    )


@router.post("/suggest-tasks", response_model=AiJobRead, status_code=status.HTTP_202_ACCEPTED)
def suggest_tasks(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_configured()
    return _create_job(db, project_id, current_user, AiJobType.suggest_tasks, {})


@router.get("/jobs", response_model=list[AiJobRead])
def list_jobs(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    return (
        db.query(AiJob)
        .filter(AiJob.project_id == project_id)
        .order_by(AiJob.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/jobs/{job_id}", response_model=AiJobRead)
def get_job(
    project_id: uuid.UUID,
    job_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    job = (
        db.query(AiJob)
        .filter(AiJob.id == job_id, AiJob.project_id == project_id)
        .first()
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job
