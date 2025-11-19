from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class Migration(BaseModel):
    """Tenant Isolated Migrations"""

    migration_id: UUID
    tenant_id: UUID
    name: str
    sql: str
    sequence: int


class MigrationCreate(BaseModel):
    """For creating migrations"""

    tenant_id: UUID
    name: str
    sql: str
    sequence: int
