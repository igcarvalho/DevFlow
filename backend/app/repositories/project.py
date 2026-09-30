import uuid

from sqlalchemy.orm import Session

from app.models.project import Project, ProjectMember, ProjectRole
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(db: Session, project_in: ProjectCreate, owner: User) -> Project:
    project = Project(
        name=project_in.name,
        description=project_in.description,
        owner_id=owner.id,
    )
    db.add(project)
    db.flush()

    member = ProjectMember(
        project_id=project.id,
        user_id=owner.id,
        role=ProjectRole.owner,
    )
    db.add(member)
    db.commit()
    db.refresh(project)
    return project


def get_project(db: Session, project_id: uuid.UUID) -> Project | None:
    return (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_active == True)  # noqa: E712
        .first()
    )


def list_projects_for_user(db: Session, user_id: uuid.UUID) -> list[Project]:
    return (
        db.query(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .filter(ProjectMember.user_id == user_id, Project.is_active == True)  # noqa: E712
        .order_by(Project.created_at.desc())
        .all()
    )


def update_project(
    db: Session, project: Project, project_in: ProjectUpdate
) -> Project:
    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    project.is_active = False
    db.commit()


def get_member(
    db: Session, project_id: uuid.UUID, user_id: uuid.UUID
) -> ProjectMember | None:
    return (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )


def list_members(db: Session, project_id: uuid.UUID) -> list[ProjectMember]:
    return (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id)
        .all()
    )


def add_member(
    db: Session, project_id: uuid.UUID, user: User, role: ProjectRole
) -> ProjectMember:
    member = ProjectMember(project_id=project_id, user_id=user.id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_member_role(
    db: Session, member: ProjectMember, role: ProjectRole
) -> ProjectMember:
    member.role = role
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, member: ProjectMember) -> None:
    db.delete(member)
    db.commit()
