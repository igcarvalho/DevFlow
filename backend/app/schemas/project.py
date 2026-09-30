import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.project import ProjectRole


class ProjectBase(BaseModel):
    name: str
    description: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectMemberRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: ProjectRole
    email: str | None = None
    full_name: str | None = None

    class Config:
        from_attributes = True


class ProjectRead(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectReadWithMembers(ProjectRead):
    members: list[ProjectMemberRead] = []


class ProjectMemberAdd(BaseModel):
    email: str
    role: ProjectRole = ProjectRole.member


class ProjectMemberUpdateRole(BaseModel):
    role: ProjectRole
