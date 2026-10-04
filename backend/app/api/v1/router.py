from fastapi import APIRouter

from app.api.v1 import ai, auth, chats, documents, issues, projects, search

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(documents.router)
api_router.include_router(chats.router)
api_router.include_router(issues.router)
api_router.include_router(ai.router)
api_router.include_router(search.router)
