import json
from uuid import UUID

from fastapi import Depends
from supabase import AsyncClient

from app.core.supabase import get_async_supabase
from app.schemas.classification_schemas import Classification, ExtractedFile
from app.schemas.relationship_schemas import RelationshipCreate
from app.utils.pattern_recognition.pattern_rec import analyze_category_relationships


class PatternRecognitionService:
    """Service for pattern recognition operations"""

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def get_classifications(self, tenant_id: UUID) -> list[Classification]:
        """Fetch all classifications for a tenant from database"""
        result = await (
            self.supabase.table("classifications")
            .select("*")
            .eq("tenant_id", str(tenant_id))
            .execute()
        )
        if not result.data:
            return []

        return [
            Classification(
                classification_id=row["id"],
                tenant_id=row["tenant_id"],
                name=row["name"],
            )
            for row in result.data
        ]

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

    async def analyze_and_store_relationships(
        self, tenant_id: UUID
    ) -> list[RelationshipCreate]:
        """
        Main workflow:
        1. Delete existing relationships for this tenant
        2. Fetch classifications and extracted files
        3. Run pattern recognition analysis
        4. Store relationships in database
        5. Return created relationships
        """
        # DELETE existing relationships first to avoid duplicates
        await (
            self.supabase.table("relationships")
            .delete()
            .eq("tenant_id", str(tenant_id))
            .execute()
        )

        # Fetch data
        classifications = await self.get_classifications(tenant_id)
        extracted_files = await self.get_extracted_files(tenant_id)

        if not classifications:
            raise ValueError("No classifications found for this tenant")

        if not extracted_files:
            raise ValueError("No extracted files found for this tenant")

        # Run analysis
        relationships = await analyze_category_relationships(
            classifications, extracted_files
        )

        # Store relationships in database
        for relationship in relationships:
            await (
                self.supabase.table("relationships")
                .insert(
                    {
                        "tenant_id": str(relationship.tenant_id),
                        "from_classification_id": str(
                            relationship.from_classification_id
                        ),
                        "to_classification_id": str(relationship.to_classification_id),
                        "type": relationship.type.value,
                    }
                )
                .execute()
            )

        return relationships


def get_pattern_recognition_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> PatternRecognitionService:
    """Dependency injection for PatternRecognitionService"""
    return PatternRecognitionService(supabase)
