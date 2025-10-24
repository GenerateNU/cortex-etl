import json
from uuid import UUID

from fastapi import Depends
from supabase import AsyncClient

from app.core.supabase import get_async_supabase
from app.schemas.classification_schemas import Classification, ExtractedFile


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
                "id, source_file_id, extracted_data, embedding, file_uploads!inner(id, type, name, tenant_id, classifications(id, tenant_id, name))"
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
                type=row["file_uploads"]["type"],
                name=row["file_uploads"]["name"],
                tenant_id=row["file_uploads"]["tenant_id"],
                extracted_file_id=row["id"],
                extracted_data=row["extracted_data"],
                embedding=json.loads(row["embedding"])
                if isinstance(row["embedding"], str)
                else row["embedding"],
                classification=Classification(
                    classification_id=row["file_uploads"]["classifications"]["id"],
                    tenant_id=row["file_uploads"]["classifications"]["tenant_id"],
                    name=row["file_uploads"]["classifications"]["name"],
                )
                if row["file_uploads"].get("classifications")
                else None,
            )
            for row in response.data
        ]

    async def get_classifications(self, tenant_id: UUID) -> list[Classification]:
        """
        Query classifications for the given tenant
        """
        response = await (
            self.supabase.table("classifications")
            .select("*")
            .eq("tenant_id", str(tenant_id))
            .execute()
        )

        if not response.data:
            return []

        return [
            Classification(
                classification_id=row["id"],
                tenant_id=row["tenant_id"],
                name=row["name"],
            )
            for row in response.data
        ]

    async def set_classifications(
        self, tenant_id: UUID, classification_names: list[str]
    ) -> list[Classification]:
        """
        Set classifications for a tenant. Creates new ones, keeps existing ones, and deletes missing ones.
        Files linked to deleted classifications will have their classification_id set to NULL.
        """
        # Get existing classifications
        existing = await self.get_classifications(tenant_id)
        existing_names = {c.name for c in existing}
        existing_by_name = {c.name: c for c in existing}

        new_names = set(classification_names)

        # Determine operations
        to_create = new_names - existing_names
        to_delete = existing_names - new_names

        # Create new classifications
        if to_create:
            await (
                self.supabase.table("classifications")
                .insert(
                    [{"tenant_id": str(tenant_id), "name": name} for name in to_create]
                )
                .execute()
            )

        # Delete removed classifications
        if to_delete:
            ids_to_delete = [
                str(existing_by_name[name].classification_id) for name in to_delete
            ]

            # First, unlink files
            await (
                self.supabase.table("file_uploads")
                .update({"classification_id": None})
                .in_("classification_id", ids_to_delete)
                .execute()
            )

            # Then delete classifications
            await (
                self.supabase.table("classifications")
                .delete()
                .in_("id", ids_to_delete)
                .execute()
            )

        # Return updated list
        return await self.get_classifications(tenant_id)

    async def classify_file(
        self, file_upload_id: UUID, classification_id: UUID
    ) -> bool:
        """
        Set the classification for a file upload.
        Returns True if successful, False otherwise.
        """
        response = await (
            self.supabase.table("file_uploads")
            .update({"classification_id": str(classification_id)})
            .eq("id", str(file_upload_id))
            .execute()
        )

        return len(response.data) > 0


def get_classification_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> ClassificationService:
    """Instantiates a ClassificationService object in route parameters"""
    return ClassificationService(supabase)
