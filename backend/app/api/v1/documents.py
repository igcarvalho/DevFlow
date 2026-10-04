import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import (
    get_current_user,
    get_project_member,
    get_project_member_flexible,
)
from app.db.session import get_db
from app.models.document import Document, DocumentStatus, DocumentVersion
from app.models.project import ProjectMember
from app.models.user import User
from app.schemas.document import (
    DocumentRead,
    DocumentReadWithVersions,
    DocumentUpdate,
    DocumentVersionRead,
)
from app.services.storage import (
    download_file,
    generate_presigned_url,
    upload_file,
)
from app.tasks.documents import process_document_version

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str | None = Form(None),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}",
        )

    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 50MB)",
        )

    document = Document(
        project_id=project_id,
        title=title,
        description=description,
        status=DocumentStatus.pending,
        created_by=current_user.id,
    )
    db.add(document)
    db.flush()

    file_key = f"{project_id}/{document.id}/v1/{file.filename}"
    upload_file(file_key, file_data, file.content_type)

    version = DocumentVersion(
        document_id=document.id,
        version_number=1,
        file_key=file_key,
        file_size=len(file_data),
        mime_type=file.content_type,
        created_by=current_user.id,
    )
    db.add(version)
    db.flush()

    document.current_version_id = version.id
    db.commit()
    db.refresh(document)

    process_document_version.delay(str(version.id))

    return document


@router.get("", response_model=list[DocumentRead])
def list_documents(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    documents = (
        db.query(Document)
        .filter(Document.project_id == project_id, Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
        .all()
    )

    version_ids = [d.current_version_id for d in documents if d.current_version_id]
    mime_map: dict[uuid.UUID, str] = {}
    if version_ids:
        versions = (
            db.query(DocumentVersion)
            .filter(DocumentVersion.id.in_(version_ids))
            .all()
        )
        mime_map = {v.id: v.mime_type for v in versions}

    result = []
    for document in documents:
        item = DocumentRead.model_validate(document)
        if document.current_version_id:
            item.mime_type = mime_map.get(document.current_version_id)
        result.append(item)
    return result


@router.get("/{document_id}", response_model=DocumentReadWithVersions)
def get_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
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

    versions = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.version_number)
        .all()
    )
    result = DocumentReadWithVersions.model_validate(document)
    result.versions = [DocumentVersionRead.model_validate(v) for v in versions]
    if document.current_version_id:
        current = next(
            (v for v in versions if v.id == document.current_version_id), None
        )
        if current is not None:
            result.mime_type = current.mime_type
    return result


@router.get("/{document_id}/versions/{version_id}/download")
def download_document_version(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    version = (
        db.query(DocumentVersion)
        .join(Document, Document.id == DocumentVersion.document_id)
        .filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id,
            Document.project_id == project_id,
            Document.deleted_at.is_(None),
        )
        .first()
    )
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    url = generate_presigned_url(version.file_key)
    return {"download_url": url}


@router.get("/{document_id}/versions/{version_id}/file")
def stream_document_version(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member_flexible)],
):
    version = (
        db.query(DocumentVersion)
        .join(Document, Document.id == DocumentVersion.document_id)
        .filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id,
            Document.project_id == project_id,
            Document.deleted_at.is_(None),
        )
        .first()
    )
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    try:
        file_data = download_file(version.file_key)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage",
        )

    return StreamingResponse(
        iter([file_data]),
        media_type=version.mime_type,
        headers={"Content-Disposition": "inline"},
    )


@router.post("/{document_id}/versions", response_model=DocumentVersionRead, status_code=status.HTTP_201_CREATED)
async def upload_new_version(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    file: UploadFile = File(...),
):
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

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}",
        )

    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 50MB)",
        )

    last_version = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.version_number.desc())
        .first()
    )
    next_version = (last_version.version_number if last_version else 0) + 1

    file_key = f"{project_id}/{document.id}/v{next_version}/{file.filename}"
    upload_file(file_key, file_data, file.content_type)

    version = DocumentVersion(
        document_id=document.id,
        version_number=next_version,
        file_key=file_key,
        file_size=len(file_data),
        mime_type=file.content_type,
        created_by=current_user.id,
    )
    db.add(version)
    db.flush()

    document.current_version_id = version.id
    document.status = DocumentStatus.pending
    db.commit()
    db.refresh(version)

    process_document_version.delay(str(version.id))

    return version


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    document_in: DocumentUpdate,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
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

    if document_in.title is not None:
        document.title = document_in.title
    if document_in.description is not None:
        document.description = document_in.description
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
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

    from datetime import datetime

    document.deleted_at = datetime.utcnow()
    db.commit()
    return None
