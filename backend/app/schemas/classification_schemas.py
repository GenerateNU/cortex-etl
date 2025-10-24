from enum import Enum
from typing import Any
from uuid import UUID

import numpy as np
from pydantic import BaseModel, Field


class Classification(BaseModel):
    """Tenant Isolated Classifications"""

    classification_id: UUID
    tenant_id: UUID
    name: str


class FileType(str, Enum):
    PDF = "pdf"
    CSV = "csv"


class ExtractedFile(BaseModel):
    """Joined type of Extracted Files and Uploaded Files"""

    file_upload_id: UUID
    type: FileType
    name: str
    tenant_id: UUID
    extracted_file_id: UUID
    extracted_data: dict[str, Any]
    embedding: list[float]
    classification: Classification | None = None


class EmbeddingDataset(BaseModel):
    """Structured data for dimensionality reduction"""

    extracted_file_ids: list[UUID]
    file_upload_ids: list[UUID]
    names: list[str]
    embeddings_list: list[list[float]]
    tenant_ids: list[UUID]

    def to_numpy(self) -> np.ndarray:
        """Convert embeddings to numpy array for UMAP"""
        return np.array(self.embeddings_list)

    @property
    def count(self) -> int:
        return len(self.names)


class DocumentPoint(BaseModel):
    """Single document in 2D space"""

    id: UUID
    source_file_id: UUID
    name: str
    x: float
    y: float
    cluster: int
    tenant_id: UUID


class PlotlyTrace(BaseModel):
    """Plotly-ready scatter trace"""

    x: list[float]
    y: list[float]
    text: list[str]
    mode: str = "markers"
    type: str = "scatter"
    name: str
    marker: dict[str, Any] = Field(default_factory=lambda: {"size": 8})
    hovertemplate: str = "%{text}<extra></extra>"


class VisualizationResponse(BaseModel):
    """Complete response for frontend"""

    documents: list[DocumentPoint]
    plotly_data: list[PlotlyTrace]
    cluster_stats: dict[int, int]
    total_count: int
