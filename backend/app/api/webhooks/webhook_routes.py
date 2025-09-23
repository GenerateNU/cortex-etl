from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.pdf_extractor import extract_pdf

router = APIRouter()


class WebhookPayload(BaseModel):
    type: str
    record: dict
    old_record: dict = None


@router.post("/extract-pdf")
async def extract_pdf_webhook(payload: WebhookPayload):
    """Handle PDF upload webhook from Supabase Storage"""
    try:
        file_name = payload.record.get("name")
        bucket = payload.record.get("bucket_id")
        tenant_id = payload.record.get("path_tokens", [None])[0]

        # Call extraction service
        result = await extract_pdf(bucket, file_name, tenant_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
