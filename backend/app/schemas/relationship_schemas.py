from enum import Enum
from uuid import UUID

from pydantic import BaseModel

from app.schemas.classification_schemas import Classification


class RelationshipType(str, Enum):
    ONE_TO_ONE = "one-to-one"
    ONE_TO_MANY = "one-to-many"
    MANY_TO_ONE = "many-to-one"
    MANY_TO_MANY = "many-to-many"


class RelationshipCreate(BaseModel):
    """Relationships outputted through the Pattern Rec"""

    tenant_id: UUID
    from_classification: Classification | None = None
    to_classification: Classification | None = None
    type: RelationshipType


class Relationship(RelationshipCreate):
    """Relationship taken in through the migration team"""

    relationship_id: UUID
