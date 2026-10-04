import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.project import Project, ProjectMember, ProjectRole
from app.models.user import User
from app.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _user_from_token(db: Session, token: str) -> User:
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None or email is None:
            raise _credentials_exception()
        token_data = TokenData(user_id=uuid.UUID(user_id), email=email)
    except (JWTError, ValueError):
        raise _credentials_exception()

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise _credentials_exception()
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user


async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    return _user_from_token(db, token)


async def get_current_user_flexible(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str | None, Query()] = None,
) -> User:
    """Authenticate via Authorization header or ?token= query parameter.

    The query parameter exists for browser requests that cannot set headers,
    such as loading a PDF in an iframe or canvas.
    """
    auth_header = request.headers.get("Authorization")
    raw_token: str | None = None
    if auth_header and auth_header.lower().startswith("bearer "):
        raw_token = auth_header[7:]
    elif token:
        raw_token = token

    if not raw_token:
        raise _credentials_exception()
    return _user_from_token(db, raw_token)


async def get_project_member(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProjectMember:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_active == True)  # noqa: E712
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this project",
        )
    return member


async def get_project_member_flexible(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_flexible)],
) -> ProjectMember:
    """Like get_project_member but accepts the token via query parameter."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_active == True)  # noqa: E712
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this project",
        )
    return member


def require_project_roles(*roles: ProjectRole):
    async def checker(
        member: Annotated[ProjectMember, Depends(get_project_member)],
    ) -> ProjectMember:
        if member.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient project permissions",
            )
        return member

    return checker
