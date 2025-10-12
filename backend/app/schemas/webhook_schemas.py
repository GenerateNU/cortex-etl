from pydantic import BaseModel, Field
from uuid import UUID


# Request models
class PDFUploadWebhookPayload(BaseModel):
    """Webhook payload when PDF is uploaded and file_uploads entry created"""

    type: str = Field(..., description="Event type: pdf.uploaded")
    file_upload_id: UUID = Field(..., description="file_uploads table UUID")
    tenant_id: UUID = Field(..., description="Tenant UUID")
    filename: str = Field(..., description="Filename without path")
    storage_path: str = Field(..., description="Full storage path: tenant_id/filename")


# Response models
class WebhookSuccessResponse(BaseModel):
    """Successful webhook processing response"""

    status: str = Field(default="success")
    file_upload_id: UUID = Field(..., description="file_uploads table UUID")
    extraction_id: UUID = Field(..., description="extracted_files table UUID")


class WebhookIgnoredResponse(BaseModel):
    """Webhook ignored (not a PDF)"""

    status: str = Field(default="ignored")
    reason: str = Field(..., description="Why webhook was skipped")


class WebhookErrorResponse(BaseModel):
    """Webhook processing error"""

    status: str = Field(default="error")
    detail: str = Field(..., description="Error message")
