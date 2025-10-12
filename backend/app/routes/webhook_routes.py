import os
from fastapi import APIRouter, HTTPException, Header
from typing import Union
from app.core.supabase import supabase
from app.services.pdf_extractor import extract_pdf_data
from app.schemas.webhook_schemas import (
    PDFUploadWebhookPayload,
    WebhookSuccessResponse,
    WebhookIgnoredResponse,
    WebhookErrorResponse,
)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post(
    "/extract_data",
    response_model=Union[
        WebhookSuccessResponse, WebhookIgnoredResponse, WebhookErrorResponse
    ],
)
async def handle_extract_webhook(
    payload: PDFUploadWebhookPayload,
    x_webhook_secret: str = Header(None, alias="X-Webhook-Secret"),
) -> Union[WebhookSuccessResponse, WebhookIgnoredResponse, WebhookErrorResponse]:
    """
    Webhook handler triggered automatically on PDF uploads
    Creates extracted_files entry with PDF data
    """
    # Verify webhook signature
    expected_secret = os.getenv("WEBHOOK_SECRET")
    if x_webhook_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Only process PDFs (should always be true from trigger, but double-check)
    if not payload.filename.endswith(".pdf"):
        return WebhookIgnoredResponse(reason="not a pdf")

    try:
        # Download PDF from storage using full path
        pdf_bytes = supabase.storage.from_("documents").download(payload.storage_path)

        # Extract data
        extracted_json = extract_pdf_data(pdf_bytes, payload.filename)

        # Store extraction linked to file_uploads record
        extraction_result = (
            supabase.table("extracted_files")
            .insert(
                {
                    "source_file_id": str(payload.file_upload_id),
                    "extracted_data": extracted_json,
                }
            )
            .execute()
        )

        return WebhookSuccessResponse(
            file_upload_id=payload.file_upload_id,
            extraction_id=extraction_result.data[0]["id"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Extraction failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
