from fastapi import Depends
from app.core.dependencies import get_current_admin
from app.services.etl_processor import start_etl_process
from fastapi import APIRouter

router = APIRouter(prefix="/process", tags=["Process"])


@router.post("/process")
async def process_etl(tenant_id: str, admin=Depends(get_current_admin)):
    """Start ETL process for a tenant"""
    result = await start_etl_process(tenant_id)
    return result
