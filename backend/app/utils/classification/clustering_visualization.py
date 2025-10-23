from sklearn.cluster import DBSCAN
from umap import UMAP

from app.schemas.classification_schemas import (
    DocumentPoint,
    EmbeddingDataset,
    ExtractedFile,
    PlotlyTrace,
    VisualizationResponse,
)


async def extract_embedding_data(
    extracted_files: list[ExtractedFile],
) -> EmbeddingDataset:
    """Extract fields from ExtractedFile list into structured dataset"""
    return EmbeddingDataset(
        extracted_file_ids=[ef.extracted_file_id for ef in extracted_files],
        file_upload_ids=[ef.file_upload_id for ef in extracted_files],
        names=[ef.name for ef in extracted_files],
        embeddings_list=[ef.embedding for ef in extracted_files],
        tenant_ids=[ef.tenant_id for ef in extracted_files],
    )


async def reduce_to_visualization(dataset: EmbeddingDataset) -> VisualizationResponse:
    # UMAP reduction
    reducer = UMAP(
        n_components=2,
        n_neighbors=min(15, dataset.count - 1),
        min_dist=0.1,
        metric="cosine",
        random_state=42,
    )
    coords_2d = reducer.fit_transform(dataset.to_numpy())

    # Clustering
    clusterer = DBSCAN(eps=0.5, min_samples=2, metric="euclidean")
    cluster_labels = clusterer.fit_predict(coords_2d)

    # Build response
    documents = [
        DocumentPoint(
            id=dataset.extracted_file_ids[i],
            source_file_id=dataset.file_upload_ids[i],
            name=dataset.names[i],
            x=float(coords_2d[i][0]),
            y=float(coords_2d[i][1]),
            cluster=int(cluster_labels[i]),
            tenant_id=dataset.tenant_ids[i],
        )
        for i in range(dataset.count)
    ]

    # Group by cluster
    clusters = {}
    for doc in documents:
        clusters.setdefault(doc.cluster, []).append(doc)

    plotly_data = [
        PlotlyTrace(
            x=[d.x for d in docs],
            y=[d.y for d in docs],
            text=[d.name for d in docs],
            name=f"Cluster {cid}" if cid >= 0 else "Noise",
            marker={"size": 8, "opacity": 0.6 if cid >= 0 else 0.3},
        )
        for cid, docs in sorted(clusters.items())
    ]

    return VisualizationResponse(
        documents=documents,
        plotly_data=plotly_data,
        cluster_stats={c: len(docs) for c, docs in clusters.items()},
        total_count=dataset.count,
    )


async def create_empty_visualization(
    dataset: EmbeddingDataset,
) -> VisualizationResponse:
    documents = [
        DocumentPoint(
            id=dataset.extracted_file_ids[0],
            source_file_id=dataset.file_upload_ids[0],
            name=dataset.names[0],
            x=0.0,
            y=0.0,
            cluster=0,
            tenant_id=dataset.tenant_ids[0],
        )
    ]

    plotly_data = [
        PlotlyTrace(
            x=[0.0],
            y=[0.0],
            text=[dataset.names[0]],
            name="Single Document",
            marker={"size": 10, "opacity": 0.8},
        )
    ]

    return VisualizationResponse(
        documents=documents,
        plotly_data=plotly_data,
        cluster_stats={0: 1},
        total_count=1,
    )
