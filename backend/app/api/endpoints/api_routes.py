from fastapi import APIRouter, Depends
from app.services.etl_processor import start_etl_process
from app.api.deps import get_current_admin
from app.core.supabase import supabase

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        supabase.table("tenants").select("count", count="exact").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@router.post("/process")
async def process_etl(tenant_id: str, admin=Depends(get_current_admin)):
    """Start ETL process for a tenant"""
    result = await start_etl_process(tenant_id)
    return result
