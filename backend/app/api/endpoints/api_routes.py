from fastapi import APIRouter, Depends
from app.services.etl_processor import start_etl_process
from app.api.deps import get_current_admin

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cortex-backend"}


@router.post("/process")
async def process_etl(tenant_id: str, admin=Depends(get_current_admin)):
    """Start ETL process for a tenant"""
    result = await start_etl_process(tenant_id)
    return result
