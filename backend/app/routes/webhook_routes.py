import os
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException

from app.utils.queue import processing_queue

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/extract_data/{file_upload_id}")
async def handle_extract_webhook(
    file_upload_id: UUID,
    x_webhook_secret: str = Header(None, alias="X-Webhook-Secret"),
) -> dict:
    if x_webhook_secret != os.getenv("WEBHOOK_SECRET"):
        raise HTTPException(status_code=401)

    # Enqueue instead of processing
    await processing_queue.enqueue(file_upload_id)

    return {"status": "queued", "file_upload_id": str(file_upload_id)}
