import os
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException

from app.schemas.preprocess_schemas import PreprocessSuccessResponse
from app.utils.preprocess.preprocessing_queue import PreprocessingQueue, get_queue

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/extract_data/{file_upload_id}", response_model=PreprocessSuccessResponse)
async def handle_extract_webhook(
    file_upload_id: UUID,
    x_webhook_secret: str = Header(None, alias="X-Webhook-Secret"),
    preprocessing_queue: PreprocessingQueue = Depends(get_queue),
) -> PreprocessSuccessResponse:
    if x_webhook_secret != os.getenv("WEBHOOK_SECRET"):
        raise HTTPException(status_code=401)

    # Enqueue instead of processing
    extracted_file_id = await preprocessing_queue.enqueue(file_upload_id)

    return PreprocessSuccessResponse(
        status="queued", file_upload_id=file_upload_id, extraction_id=extracted_file_id
    )
