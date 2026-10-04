import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_project_member
from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.project import ProjectMember
from app.models.user import User
from app.schemas.chat import ChatRead, MessageCreate, MessageRead

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])


def _get_chat(db: Session, project_id: uuid.UUID) -> Chat:
    chat = db.query(Chat).filter(Chat.project_id == project_id).first()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


def _serialize(message: Message) -> MessageRead:
    return MessageRead(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        content=message.content,
        reply_to_id=message.reply_to_id,
        created_at=message.created_at,
        updated_at=message.updated_at,
        sender_name=message.sender.full_name if message.sender else None,
        sender_email=message.sender.email if message.sender else None,
    )


@router.get("", response_model=ChatRead)
def get_chat(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    return _get_chat(db, project_id)


@router.get("/messages", response_model=list[MessageRead])
def list_messages(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    limit: int = 100,
):
    chat = _get_chat(db, project_id)
    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat.id, Message.deleted_at.is_(None))
        .order_by(Message.created_at.asc())
        .limit(min(limit, 500))
        .all()
    )
    return [_serialize(m) for m in messages]


@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    project_id: uuid.UUID,
    message_in: MessageCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    chat = _get_chat(db, project_id)

    if message_in.reply_to_id is not None:
        parent = (
            db.query(Message)
            .filter(
                Message.id == message_in.reply_to_id,
                Message.chat_id == chat.id,
            )
            .first()
        )
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message to reply to not found",
            )

    message = Message(
        chat_id=chat.id,
        sender_id=current_user.id,
        content=message_in.content,
        reply_to_id=message_in.reply_to_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _serialize(message)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    project_id: uuid.UUID,
    message_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
):
    chat = _get_chat(db, project_id)
    message = (
        db.query(Message)
        .filter(Message.id == message_id, Message.chat_id == chat.id)
        .first()
    )
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    is_author = message.sender_id == current_user.id
    can_manage = member.role.value in ("owner", "admin")
    if not is_author and not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete this message",
        )

    message.deleted_at = datetime.utcnow()
    db.commit()
    return None
