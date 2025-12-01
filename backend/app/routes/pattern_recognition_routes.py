from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.relationship_schemas import RelationshipCreate
from app.services.pattern_recognition_service import (
    PatternRecognitionService,
    get_pattern_recognition_service,
)

router = APIRouter(prefix="/pattern-recognition", tags=["Pattern Recognition"])


@router.post("/analyze/{tenant_id}", response_model=list[RelationshipCreate])
async def analyze_relationships(
    tenant_id: UUID,
    pattern_service: PatternRecognitionService = Depends(
        get_pattern_recognition_service
    ),
    # admin=Depends(get_current_admin),
) -> list[RelationshipCreate]:
    """
    Analyze relationships between classifications for a tenant.

    This endpoint:
    1. Fetches all classifications for the tenant
    2. Fetches all extracted files for the tenant
    3. Runs pattern recognition to find relationships
    4. Stores relationships in the database
    5. Returns the found relationships
    """
    try:
        extracted_files = await pattern_service.get_extracted_files(tenant_id)

        if not extracted_files or len(extracted_files) == 0:
            raise HTTPException(
                status_code=404, detail="No documents with embeddings found"
            )

        classifications = await pattern_service.get_classifications(tenant_id)

        if not classifications or len(classifications) == 0:
            raise HTTPException(status_code=404, detail="No classifications found")

        relationships = await pattern_service.analyze_and_store_relationships(tenant_id)

        if not relationships or len(relationships) == 0:
            raise HTTPException(status_code=404, detail="No relationships found")

        return relationships

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
