import os

from fastapi import APIRouter, Header, HTTPException

from app.schemas.webhook_schemas import PDFUploadWebhookPayload, WebhookSuccessResponse
from app.services.preprocess_service import process_pdf_upload

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/extract_data", response_model=WebhookSuccessResponse)
async def handle_extract_webhook(
    payload: PDFUploadWebhookPayload,
    x_webhook_secret: str = Header(None, alias="X-Webhook-Secret"),
) -> WebhookSuccessResponse:
    """Webhook triggered on PDF uploads"""

    # Verify signature
    if x_webhook_secret != os.getenv("WEBHOOK_SECRET"):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Process PDF
    extraction_id = await process_pdf_upload(payload)

    return WebhookSuccessResponse(
        file_upload_id=payload.file_upload_id, extraction_id=extraction_id
    )
