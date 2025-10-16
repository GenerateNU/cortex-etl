import json
from uuid import UUID

from app.core.supabase import supabase
from app.schemas.classification_schemas import ExtractedFile


class ClassificationService:
    def get_extracted_files(self, tenant_id: UUID) -> list[ExtractedFile]:
        """
        Query extracted files with embeddings joined to file uploads
        """
        response = (
            supabase.table("extracted_files")
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


def get_classification_service():
    return ClassificationService()
