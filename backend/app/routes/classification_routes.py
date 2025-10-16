from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_admin
from app.schemas.classification_schemas import ExtractedFile, VisualizationResponse
from app.services.classification_service import (
    ClassificationService,
    get_classification_service,
)
from app.utils.classification.clustering_visualization import (
    create_empty_visualization,
    extract_embedding_data,
    reduce_to_visualization,
)

router = APIRouter(prefix="/classification", tags=["Classification"])


@router.get("/visualize_clustering/{tenant_id}", response_model=VisualizationResponse)
async def visualize_clustering(
    tenant_id: UUID,
    classificationService: ClassificationService = Depends(get_classification_service),
    admin=Depends(get_current_admin),
):
    """
    Visualize document embeddings in 2D space
    Query param: ?tenant_id=xxx (optional for tenant filtering)
    """
    try:
        extracted_files: list[ExtractedFile] = (
            classificationService.get_extracted_files(tenant_id)
        )

        if not extracted_files or len(extracted_files) == 0:
            raise HTTPException(
                status_code=404, detail="No documents with embeddings found"
            )

        dataset = extract_embedding_data(extracted_files)

        if len(extracted_files) < 2:
            return create_empty_visualization(dataset)

        visualizationResponse = reduce_to_visualization(dataset)

        return visualizationResponse

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
