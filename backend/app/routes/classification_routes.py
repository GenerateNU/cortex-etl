from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_admin
from app.schemas.classification_schemas import (
    Classification,
    ExtractedFile,
    VisualizationResponse,
)
from app.services.classification_service import (
    ClassificationService,
    get_classification_service,
)
from app.utils.classification.clustering_visualization import (
    create_empty_visualization,
    extract_embedding_data,
    reduce_to_visualization,
)
from app.utils.classification.create_classifications import (
    create_classifications as create_classifications_helper,
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
        extracted_files: list[
            ExtractedFile
        ] = await classificationService.get_extracted_files(tenant_id)

        if not extracted_files or len(extracted_files) == 0:
            raise HTTPException(
                status_code=404, detail="No documents with embeddings found"
            )

        dataset = await extract_embedding_data(extracted_files)

        if len(extracted_files) < 2:
            return await create_empty_visualization(dataset)

        visualizationResponse = await reduce_to_visualization(dataset)

        return visualizationResponse

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/create_classifications/{tenant_id}", response_model=list[Classification])
async def create_classifications(
    tenant_id: UUID,
    classificationService: ClassificationService = Depends(get_classification_service),
    admin=Depends(get_current_admin),
) -> list[Classification]:
    """
    Analyze all extracted files and create or update classifications
    """
    try:
        extracted_files: list[
            ExtractedFile
        ] = await classificationService.get_extracted_files(tenant_id)

        if not extracted_files or len(extracted_files) == 0:
            raise HTTPException(
                status_code=404, detail="No documents with embeddings found"
            )

        initial_classifications: list[
            Classification
        ] = await classificationService.get_classifications(tenant_id)

        if not initial_classifications:
            raise HTTPException(
                status_code=404, detail="Unable to get initial classifications"
            )

        classification_names: list[str] = await create_classifications_helper(
            tenant_id,
            [classification.name for classification in initial_classifications],
        )

        if not classification_names:
            raise HTTPException(
                status_code=500, detail="Unable to create classifications"
            )

        classifications: list[
            Classification
        ] = await classificationService.set_classifications(
            tenant_id, classification_names
        )

        if not classifications:
            raise HTTPException(
                status_code=500, detail="Unable to set new classifications"
            )

        return classifications

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
