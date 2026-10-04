import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_project_member
from app.db.session import get_db
from app.models.project import ProjectMember
from app.schemas.search import SearchResponse
from app.services.search import search_documents, search_messages

router = APIRouter(prefix="/projects/{project_id}/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search(
    project_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    member: Annotated[ProjectMember, Depends(get_project_member)],
    q: str = Query(..., min_length=2, description="Termo de busca"),
    type_filter: str = Query("all", alias="type", pattern="^(all|documents|messages)$"),
    limit: int = Query(20, ge=1, le=50),
):
    query = q.strip()

    documents = []
    messages = []

    if type_filter in ("all", "documents"):
        documents = search_documents(db, project_id, query, limit)
    if type_filter in ("all", "messages"):
        messages = search_messages(db, project_id, query, limit)

    return SearchResponse(
        query=query,
        documents=documents,
        messages=messages,
        total=len(documents) + len(messages),
    )
