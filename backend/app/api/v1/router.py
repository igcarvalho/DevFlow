from fastapi import APIRouter

from app.api.v1 import auth, chats, documents, projects

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(documents.router)
api_router.include_router(chats.router)
