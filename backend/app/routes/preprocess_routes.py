from uuid import UUID

from fastapi import APIRouter, Depends

from app.schemas.preprocess_schemas import (
    PreprocessSuccessResponse,
)
from app.services.preprocess_service import PreprocessService, get_preprocess_service

router = APIRouter(prefix="/preprocess", tags=["Preprocess"])


@router.post(
    "/retry_extraction/{file_upload_id}", response_model=PreprocessSuccessResponse
)
async def handle_extract_webhook(
    file_upload_id: UUID,
    preprocess_service: PreprocessService = Depends(get_preprocess_service),
) -> PreprocessSuccessResponse:
    """Webhook triggered on PDF uploads"""

    await preprocess_service.delete_previous_extraction(file_upload_id)

    # Process PDF
    extraction_id = await preprocess_service.process_pdf_upload(file_upload_id)

    return PreprocessSuccessResponse(
        file_upload_id=file_upload_id, extraction_id=extraction_id
    )
