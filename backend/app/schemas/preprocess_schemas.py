from uuid import UUID

from pydantic import BaseModel, Field


# Response models
class PreprocessSuccessResponse(BaseModel):
    """Successful webhook processing response"""

    status: str = Field(default="success")
    file_upload_id: UUID = Field(..., description="file_uploads table UUID")
    extraction_id: UUID = Field(..., description="extracted_files table UUID")
