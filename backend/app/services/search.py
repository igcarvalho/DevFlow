import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.chat import Chat, Message
from app.models.document import Document, DocumentVersion

SNIPPET_RADIUS = 120


def make_snippet(text: str | None, query: str) -> str | None:
    """Return a snippet of text centered around the first match of query."""
    if not text:
        return None
    lowered = text.lower()
    index = lowered.find(query.lower())
    if index == -1:
        snippet = text[: SNIPPET_RADIUS * 2].strip()
        return snippet + ("..." if len(text) > SNIPPET_RADIUS * 2 else "")
    start = max(0, index - SNIPPET_RADIUS)
    end = min(len(text), index + len(query) + SNIPPET_RADIUS)
    snippet = text[start:end].strip()
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    return f"{prefix}{snippet}{suffix}"


def search_documents(
    db: Session, project_id: uuid.UUID, query: str, limit: int = 20
) -> list[dict]:
    pattern = f"%{query}%"

    documents = (
        db.query(Document)
        .filter(
            Document.project_id == project_id,
            Document.deleted_at.is_(None),
            or_(
                Document.title.ilike(pattern),
                Document.description.ilike(pattern),
            ),
        )
        .order_by(Document.created_at.desc())
        .limit(limit)
        .all()
    )

    results: list[dict] = []
    seen: set[uuid.UUID] = set()

    for document in documents:
        results.append(
            {
                "id": document.id,
                "title": document.title,
                "description": document.description,
                "status": document.status.value,
                "created_at": document.created_at,
                "snippet": make_snippet(document.description or document.title, query),
                "version_id": document.current_version_id,
            }
        )
        seen.add(document.id)

    # search inside extracted text
    versions = (
        db.query(DocumentVersion)
        .join(Document, Document.id == DocumentVersion.document_id)
        .filter(
            Document.project_id == project_id,
            Document.deleted_at.is_(None),
            DocumentVersion.extracted_text.ilike(pattern),
        )
        .order_by(DocumentVersion.created_at.desc())
        .limit(limit)
        .all()
    )

    for version in versions:
        if version.document_id in seen:
            continue
        document = (
            db.query(Document).filter(Document.id == version.document_id).first()
        )
        if document is None:
            continue
        results.append(
            {
                "id": document.id,
                "title": document.title,
                "description": document.description,
                "status": document.status.value,
                "created_at": document.created_at,
                "snippet": make_snippet(version.extracted_text, query),
                "version_id": version.id,
            }
        )
        seen.add(document.id)

    return results[:limit]


def search_messages(
    db: Session, project_id: uuid.UUID, query: str, limit: int = 20
) -> list[dict]:
    pattern = f"%{query}%"

    messages = (
        db.query(Message)
        .join(Chat, Chat.id == Message.chat_id)
        .filter(
            Chat.project_id == project_id,
            Message.deleted_at.is_(None),
            Message.content.ilike(pattern),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": message.id,
            "chat_id": message.chat_id,
            "content": message.content,
            "sender_id": message.sender_id,
            "sender_name": message.sender.full_name if message.sender else None,
            "created_at": message.created_at,
            "snippet": make_snippet(message.content, query),
        }
        for message in messages
    ]
