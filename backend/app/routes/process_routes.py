from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/process", tags=["Process"])


@router.post("/process")
async def process_etl(tenant_id: str, admin=Depends(get_current_admin)):
    """Start ETL process for a tenant"""
    pass
