import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_project_member, require_project_roles
from app.db.session import get_db
from app.models.project import ProjectMember, ProjectRole
from app.models.user import User
from app.repositories import project as project_repo
from app.repositories.user import get_user_by_email
from app.schemas.project import (
    ProjectCreate,
    ProjectMemberAdd,
    ProjectMemberRead,
    ProjectMemberUpdateRole,
    ProjectRead,
    ProjectReadWithMembers,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return project_repo.create_project(db, project_in, current_user)


@router.get("", response_model=list[ProjectRead])
def list_my_projects(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return project_repo.list_projects_for_user(db, current_user.id)


@router.get("/{project_id}", response_model=ProjectReadWithMembers)
def get_project(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    project = project_repo.get_project(db, project_id)
    members = project_repo.list_members(db, project_id)
    result = ProjectReadWithMembers.model_validate(project)
    result.members = [
        ProjectMemberRead(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            email=m.user.email if m.user else None,
            full_name=m.user.full_name if m.user else None,
        )
        for m in members
    ]
    return result


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(require_project_roles(ProjectRole.owner, ProjectRole.admin))],
):
    project = project_repo.get_project(db, project_id)
    return project_repo.update_project(db, project, project_in)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(require_project_roles(ProjectRole.owner))],
):
    project = project_repo.get_project(db, project_id)
    project_repo.delete_project(db, project)
    return None


@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberRead,
    status_code=status.HTTP_201_CREATED,
)
def add_project_member(
    project_id: uuid.UUID,
    member_in: ProjectMemberAdd,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(require_project_roles(ProjectRole.owner, ProjectRole.admin))],
):
    user = get_user_by_email(db, member_in.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    existing = project_repo.get_member(db, project_id, user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member",
        )
    new_member = project_repo.add_member(db, project_id, user, member_in.role)
    return ProjectMemberRead(
        id=new_member.id,
        user_id=new_member.user_id,
        role=new_member.role,
        email=user.email,
        full_name=user.full_name,
    )


@router.patch("/{project_id}/members/{user_id}", response_model=ProjectMemberRead)
def update_project_member_role(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    role_in: ProjectMemberUpdateRole,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(require_project_roles(ProjectRole.owner))],
):
    target = project_repo.get_member(db, project_id, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    if target.role == ProjectRole.owner and role_in.role != ProjectRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the owner's role",
        )
    updated = project_repo.update_member_role(db, target, role_in.role)
    return ProjectMemberRead(
        id=updated.id,
        user_id=updated.user_id,
        role=updated.role,
        email=updated.user.email if updated.user else None,
        full_name=updated.user.full_name if updated.user else None,
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    target = project_repo.get_member(db, project_id, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    if target.role == ProjectRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the project owner",
        )
    is_self = user_id == current_user.id
    can_manage = member.role in (ProjectRole.owner, ProjectRole.admin)
    if not is_self and not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to remove this member",
        )
    project_repo.remove_member(db, target)
    return None
