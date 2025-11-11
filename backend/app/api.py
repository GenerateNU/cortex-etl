from fastapi import APIRouter, Depends
from supabase._async.client import AsyncClient

from app.core.supabase import get_async_supabase
from app.routes.classification_routes import router as classification_router
from app.routes.preprocess_routes import router as preprocess_router
from app.routes.webhook_routes import router as webhook_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check(supabase: AsyncClient = Depends(get_async_supabase)):
    try:
        await supabase.table("tenants").select("count", count="exact").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


api_router.include_router(classification_router)
api_router.include_router(preprocess_router)
api_router.include_router(webhook_router)
