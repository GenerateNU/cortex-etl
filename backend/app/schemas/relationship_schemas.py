from enum import Enum
from uuid import UUID

from backend.app.schemas.classification_schemas import Classification
from pydantic import BaseModel


class RelationshipType(str, Enum):
    ONE_TO_ONE = "one-to-one"
    ONE_TO_MANY = "one-to-many"
    MANY_TO_ONE = "many-to-one"
    MANY_TO_MANY = "many-to-many"


class Relationship(BaseModel):
    """Relationships given through the Pattern Rec"""

    relationship_id: UUID
    tenant_id: UUID
    from_classification: Classification | None = None
    to_classification: Classification | None = None
    type: RelationshipType
