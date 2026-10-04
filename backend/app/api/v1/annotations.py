import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_project_member
from app.db.session import get_db
from app.models.annotation import Annotation
from app.models.document import Document, DocumentVersion
from app.models.project import ProjectMember, ProjectRole
from app.models.user import User
from app.schemas.annotation import (
    AnnotationCreate,
    AnnotationRead,
    AnnotationUpdate,
)

router = APIRouter(
    prefix="/projects/{project_id}/documents/{document_id}/annotations",
    tags=["annotations"],
)


def _serialize(annotation: Annotation) -> AnnotationRead:
    return AnnotationRead(
        id=annotation.id,
        document_id=annotation.document_id,
        version_id=annotation.version_id,
        page_number=annotation.page_number,
        type=annotation.type,
        content=annotation.content,
        position=annotation.position,
        created_by=annotation.created_by,
        created_at=annotation.created_at,
        updated_at=annotation.updated_at,
        author_name=annotation.author.full_name if annotation.author else None,
    )


def _ensure_document(
    db: Session, project_id: uuid.UUID, document_id: uuid.UUID
) -> Document:
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


def _get_annotation(
    db: Session, document_id: uuid.UUID, annotation_id: uuid.UUID
) -> Annotation:
    annotation = (
        db.query(Annotation)
        .filter(
            Annotation.id == annotation_id,
            Annotation.document_id == document_id,
        )
        .first()
    )
    if annotation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found"
        )
    return annotation


@router.post("", response_model=AnnotationRead, status_code=status.HTTP_201_CREATED)
def create_annotation(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    annotation_in: AnnotationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_document(db, project_id, document_id)

    version = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.id == annotation_in.version_id,
            DocumentVersion.document_id == document_id,
        )
        .first()
    )
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version does not belong to this document",
        )

    annotation = Annotation(
        document_id=document_id,
        version_id=annotation_in.version_id,
        page_number=annotation_in.page_number,
        type=annotation_in.type,
        content=annotation_in.content,
        position=annotation_in.position,
        created_by=current_user.id,
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return _serialize(annotation)


@router.get("", response_model=list[AnnotationRead])
def list_annotations(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    page_number: int | None = None,
):
    _ensure_document(db, project_id, document_id)
    query = db.query(Annotation).filter(Annotation.document_id == document_id)
    if page_number is not None:
        query = query.filter(Annotation.page_number == page_number)
    annotations = query.order_by(Annotation.created_at.asc()).all()
    return [_serialize(a) for a in annotations]


@router.patch("/{annotation_id}", response_model=AnnotationRead)
def update_annotation(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    annotation_id: uuid.UUID,
    annotation_in: AnnotationUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_document(db, project_id, document_id)
    annotation = _get_annotation(db, document_id, annotation_id)

    is_author = annotation.created_by == current_user.id
    can_manage = member.role in (ProjectRole.owner, ProjectRole.admin)
    if not is_author and not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit this annotation",
        )

    data = annotation_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(annotation, field, value)

    db.commit()
    db.refresh(annotation)
    return _serialize(annotation)


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    annotation_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    _ensure_document(db, project_id, document_id)
    annotation = _get_annotation(db, document_id, annotation_id)

    is_author = annotation.created_by == current_user.id
    can_manage = member.role in (ProjectRole.owner, ProjectRole.admin)
    if not is_author and not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete this annotation",
        )

    db.delete(annotation)
    db.commit()
    return None
