import json
from uuid import UUID

from fastapi import Depends
from supabase import AsyncClient

from app.core.supabase import get_async_supabase
from app.schemas.classification_schemas import ExtractedFile


class ClassificationService:
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def get_extracted_files(self, tenant_id: UUID) -> list[ExtractedFile]:
        """
        Query extracted files with embeddings joined to file uploads
        """
        response = await (
            self.supabase.table("extracted_files")
            .select(
                "id, source_file_id, extracted_data, embedding, file_uploads!inner(id, name, tenant_id)"
            )
            .not_.is_("embedding", "null")
            .eq("file_uploads.tenant_id", str(tenant_id))
            .execute()
        )

        if not response.data:
            return []

        return [
            ExtractedFile(
                file_upload_id=row["file_uploads"]["id"],
                name=row["file_uploads"]["name"],
                tenant_id=row["file_uploads"]["tenant_id"],
                extracted_file_id=row["id"],
                extracted_data=row["extracted_data"],
                embedding=json.loads(row["embedding"])
                if isinstance(row["embedding"], str)
                else row["embedding"],
            )
            for row in response.data
        ]


def get_classification_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> ClassificationService:
    """Instantiates a ClassificationService object in route parameters"""
    return ClassificationService(supabase)
