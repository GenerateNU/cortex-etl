from fastapi import APIRouter
from app.core.supabase import supabase
from app.routes.files.routes import router as files_router
from app.routes.process.routes import router as process_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    try:
        supabase.table("tenants").select("count", count="exact").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


api_router.include_router(files_router)
api_router.include_router(process_router)
