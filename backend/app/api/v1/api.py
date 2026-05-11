from fastapi import APIRouter

from app.api.v1.endpoints import auth, automation, documents, webhooks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(automation.router, prefix="/automation", tags=["automation"])
