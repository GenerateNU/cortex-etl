from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_admin
from app.schemas.preprocess_schemas import PreprocessSuccessResponse
from app.services.preprocess_service import PreprocessService, get_preprocess_service
from app.utils.preprocess.preprocessing_queue import PreprocessingQueue, get_queue

router = APIRouter(prefix="/preprocess", tags=["Preprocess"])


@router.post(
    "/retry_extraction/{file_upload_id}",
    response_model=PreprocessSuccessResponse,
)
async def handle_extract_webhook(
    file_upload_id: UUID,
    preprocess_service: PreprocessService = Depends(get_preprocess_service),
    preprocessing_queue: PreprocessingQueue = Depends(get_queue),
    admin=Depends(get_current_admin),
) -> PreprocessSuccessResponse:
    """Webhook triggered on PDF uploads"""

    await preprocess_service.delete_previous_extraction(file_upload_id)

    # Enqueue instead of processing
    extracted_file_id = await preprocessing_queue.enqueue(file_upload_id)

    return PreprocessSuccessResponse(
        status="queued", file_upload_id=file_upload_id, extraction_id=extracted_file_id
    )
