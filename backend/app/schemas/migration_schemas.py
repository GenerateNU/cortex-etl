
from __future__ import annotations

from enum import Enum
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field

from .classification_schemas import Classification


# ---------- Relationship schemas (from pattern team) ----------

class RelationshipType(str, Enum):
    ONE_TO_ONE = "ONE_TO_ONE"
    ONE_TO_MANY = "ONE_TO_MANY"
    MANY_TO_MANY = "MANY_TO_MANY"


class RelationshipCreate(BaseModel):
    """
    Shape used when we FIRST create a relationship entry.

    Uses classification IDs only, since we might not want to embed full
    Classification objects when writing to the DB.
    """

    tenant_id: UUID
    from_classification_id: UUID
    to_classification_id: UUID
    type: RelationshipType


class Relationship(BaseModel):
    """
    Full relationship with nested Classification objects.
    This is the type your migration generator function will use.
    """

    relationship_id: UUID
    tenant_id: UUID
    from_classification: Classification
    to_classification: Classification
    type: RelationshipType


# ---------- Migration schemas (for your team) ----------

class Migration(BaseModel):
    """
    A single schema migration for a tenant.

    - name: human-readable + deterministic label, used to detect duplicates
    - sql: the actual SQL we will run for this migration
    """

    migration_id: UUID = Field(
        ...,
        description="Unique ID for this migration object (per tenant).",
    )
    tenant_id: UUID
    name: str = Field(
        ...,
        description="Deterministic name, e.g. 'create_table_robot_specs'.",
    )
    sql: str = Field(
        ...,
        description="The SQL statement(s) that implement this migration.",
    )
    created_at: datetime = Field(
        ...,
        description="When this migration entry was created.",
    )


class MigrationCreate(BaseModel):
    """
    Optional helper schema if you ever want a 'create' version
    (without id/created_at) for API or internal usage.
    """

    tenant_id: UUID
    name: str
    sql: str