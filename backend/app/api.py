from fastapi import APIRouter

from app.core.supabase import supabase
from app.routes.preprocess_routes import router as preprocess_router
from app.routes.process_routes import router as process_router
from app.routes.webhook_routes import router as webhook_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    try:
        supabase.table("tenants").select("count", count="exact").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


api_router.include_router(preprocess_router)
api_router.include_router(process_router)
api_router.include_router(webhook_router)
