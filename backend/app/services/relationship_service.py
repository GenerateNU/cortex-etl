from uuid import UUID

from fastapi import Depends
from supabase._async.client import AsyncClient

from app.core.supabase import get_async_supabase
from app.schemas.classification_schemas import Classification
from app.schemas.relationship_schemas import Relationship, RelationshipCreate


class RelationshipService:
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def get_relationships(self, tenant_id: UUID) -> list[Relationship]:
        """
        Query relationships for the given tenant joining classifications.
        """
        response = await (
            self.supabase.table("relationships")
            .select(
                "id, tenant_id, from_classification_id, to_classification_id, type, "
                "from_classification:classifications!from_classification_id(id, tenant_id, name), "
                "to_classification:classifications!to_classification_id(id, tenant_id, name)"
            )
            .eq("tenant_id", str(tenant_id))
            .execute()
        )

        if not response.data:
            return []

        return [
            Relationship(
                relationship_id=row["id"],
                tenant_id=row["tenant_id"],
                type=row["type"],
                from_classification=Classification(
                    classification_id=row["from_classification"]["id"],
                    tenant_id=row["from_classification"]["tenant_id"],
                    name=row["from_classification"]["name"],
                ),
                to_classification=Classification(
                    classification_id=row["to_classification"]["id"],
                    tenant_id=row["to_classification"]["tenant_id"],
                    name=row["to_classification"]["name"],
                ),
            )
            for row in response.data
        ]

    async def create_relationship(self, new_relationship: RelationshipCreate) -> UUID:
        """
        Create a new relationship for a tenant.
        """
        insert_response = await (
            self.supabase.table("relationships")
            .insert(
                {
                    "tenant_id": str(new_relationship.tenant_id),
                    "from_classification_id": str(
                        new_relationship.from_classification_id
                    ),
                    "to_classification_id": str(new_relationship.to_classification_id),
                    "type": new_relationship.type,
                }
            )
            .select("id")
            .execute()
        )

        return insert_response.data[0]["id"]


def get_relationship_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> RelationshipService:
    """Instantiates a RelationshipService object in route parameters"""
    return RelationshipService(supabase)
