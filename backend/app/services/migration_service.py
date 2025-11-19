from uuid import UUID

from fastapi import Depends
from supabase._async.client import AsyncClient

from app.core.supabase import get_async_supabase
from app.schemas.migration_schemas import Migration, MigrationCreate


class MigrationService:
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def get_migrations(self, tenant_id: UUID) -> list[Migration]:
        """
        Query migrations for the given tenant
        """
        response = await (
            self.supabase.table("migrations")
            .select("id, tenant_id, name, sql, sequence")
            .order("sequence", desc=False)
            .eq("tenant_id", str(tenant_id))
            .execute()
        )

        if not response.data:
            return []

        return [
            Migration(
                migration_id=row["id"],
                tenant_id=row["tenant_id"],
                name=row["name"],
                sql=row["sql"],
                sequence=row["sequence"],
            )
            for row in response.data
        ]

    async def create_migration(self, new_migration: MigrationCreate) -> UUID:
        """
        Create a new migration for a tenant.
        """
        insert_response = await (
            self.supabase.table("migrations")
            .insert(
                {
                    "tenant_id": str(new_migration.tenant_id),
                    "name": new_migration.name,
                    "sql": new_migration.sql,
                    "sequence": new_migration.sequence,
                }
            )
            .select("id")
            .execute()
        )

        return insert_response.data[0]["id"]

    async def execute_migration(self, str_sql: str) -> None:
        """
        Execute a single migration SQL statement using the execute_sql function.
        """
        await self.supabase.rpc(
            "execute_sql",
            {"query": str_sql},
        ).execute()

    async def execute_migrations(self, tenant_id: UUID) -> None:
        """
        Execute all migrations for a tenant.
        """
        migrations = await self.get_migrations(tenant_id)
        for migration in migrations:
            await self.execute_migration(migration.sql)


def get_migration_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> MigrationService:
    """Instantiates a MigrationService object in route parameters"""
    return MigrationService(supabase)
