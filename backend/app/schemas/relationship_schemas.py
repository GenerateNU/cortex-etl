from enum import Enum
from uuid import UUID

from pydantic import BaseModel

from app.schemas.classification_schemas import Classification


class RelationshipType(str, Enum):
    ONE_TO_ONE = "one-to-one"
    ONE_TO_MANY = "one-to-many"
    MANY_TO_MANY = "many-to-many"


class RelationshipBase(BaseModel):
    """Base fields for relationships"""

    tenant_id: UUID
    type: RelationshipType


class RelationshipCreate(RelationshipBase):
    """For creating relationships"""

    from_classification_id: UUID
    to_classification_id: UUID


class Relationship(RelationshipBase):
    """For reading relationships"""

    relationship_id: UUID
    from_classification: Classification
    to_classification: Classification
