import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_project_member
from app.db.session import get_db
from app.models.issue import Issue, IssueStatus
from app.models.project import ProjectMember, ProjectRole
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueRead, IssueUpdate

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])


def _serialize(issue: Issue) -> IssueRead:
    return IssueRead(
        id=issue.id,
        project_id=issue.project_id,
        title=issue.title,
        description=issue.description,
        status=issue.status,
        priority=issue.priority,
        assignee_id=issue.assignee_id,
        due_date=issue.due_date,
        document_id=issue.document_id,
        message_id=issue.message_id,
        created_by=issue.created_by,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        closed_at=issue.closed_at,
        assignee_name=issue.assignee.full_name if issue.assignee else None,
    )


def _get_issue(db: Session, project_id: uuid.UUID, issue_id: uuid.UUID) -> Issue:
    issue = (
        db.query(Issue)
        .filter(Issue.id == issue_id, Issue.project_id == project_id)
        .first()
    )
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.post("", response_model=IssueRead, status_code=status.HTTP_201_CREATED)
def create_issue(
    project_id: uuid.UUID,
    issue_in: IssueCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    issue = Issue(
        project_id=project_id,
        title=issue_in.title,
        description=issue_in.description,
        status=issue_in.status,
        priority=issue_in.priority,
        assignee_id=issue_in.assignee_id,
        due_date=issue_in.due_date,
        document_id=issue_in.document_id,
        message_id=issue_in.message_id,
        created_by=current_user.id,
    )
    if issue.status == IssueStatus.done:
        issue.closed_at = datetime.utcnow()
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return _serialize(issue)


@router.get("", response_model=list[IssueRead])
def list_issues(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    status_filter: IssueStatus | None = None,
    assignee_id: uuid.UUID | None = None,
):
    query = db.query(Issue).filter(Issue.project_id == project_id)
    if status_filter is not None:
        query = query.filter(Issue.status == status_filter)
    if assignee_id is not None:
        query = query.filter(Issue.assignee_id == assignee_id)
    issues = query.order_by(Issue.created_at.desc()).all()
    return [_serialize(i) for i in issues]


@router.get("/{issue_id}", response_model=IssueRead)
def get_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    return _serialize(_get_issue(db, project_id, issue_id))


@router.patch("/{issue_id}", response_model=IssueRead)
def update_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    issue_in: IssueUpdate,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    issue = _get_issue(db, project_id, issue_id)
    data = issue_in.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(issue, field, value)

    if "status" in data:
        if issue.status == IssueStatus.done and issue.closed_at is None:
            issue.closed_at = datetime.utcnow()
        elif issue.status != IssueStatus.done:
            issue.closed_at = None

    db.commit()
    db.refresh(issue)
    return _serialize(issue)


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    issue = _get_issue(db, project_id, issue_id)
    db.delete(issue)
    db.commit()
    return None
