from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient

from app.core.dependencies import get_current_admin
from app.core.supabase import get_async_supabase
from app.schemas.classification_schemas import Classification, ExtractedFile
from app.schemas.migration_schemas import Migration, MigrationCreate
from app.schemas.relationship_schemas import Relationship
from app.services.classification_service import (
    ClassificationService,
    get_classification_service,
)
from app.services.migration_service import (
    MigrationService,
    get_migration_service,
)
from app.services.relationship_service import (
    RelationshipService,
    get_relationship_service,
)
from app.utils.migrations import _table_name_for_classification, create_migrations

router = APIRouter(prefix="/migrations", tags=["Migrations"])


@router.get("/{tenant_id}", response_model=list[Migration])
async def list_migrations(
    tenant_id: UUID,
    migration_service: MigrationService = Depends(get_migration_service),
    admin=Depends(get_current_admin),
) -> list[Migration]:
    """
    Return all migrations for a tenant in sequence order.
    """
    try:
        migrations = await migration_service.get_migrations(tenant_id)
        return migrations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/generate/{tenant_id}", response_model=list[Migration])
async def generate_migrations(
    tenant_id: UUID,
    classification_service: ClassificationService = Depends(get_classification_service),
    relationship_service: RelationshipService = Depends(get_relationship_service),
    migration_service: MigrationService = Depends(get_migration_service),
    admin=Depends(get_current_admin),
) -> list[Migration]:
    """
    Deterministically generate *new* migrations for a tenant based on:
      - current classifications
      - current relationships
      - existing migrations

    Then insert the new migrations into the `migrations` table and return them.
    """
    try:
        classifications: list[
            Classification
        ] = await classification_service.get_classifications(tenant_id)
        relationships: list[
            Relationship
        ] = await relationship_service.get_relationships(tenant_id)
        existing_migrations: list[Migration] = await migration_service.get_migrations(
            tenant_id
        )

        if not classifications:
            raise HTTPException(
                status_code=404, detail="No classifications found for tenant"
            )

        new_migration_creates: list[MigrationCreate] = create_migrations(
            classifications=classifications,
            relationships=relationships,
            initial_migrations=existing_migrations,
        )

        if not new_migration_creates:
            return []

        created: list[Migration] = []
        for m in new_migration_creates:
            new_id = await migration_service.create_migration(m)
            created.append(
                Migration(
                    migration_id=new_id,
                    tenant_id=m.tenant_id,
                    name=m.name,
                    sql=m.sql,
                    sequence=m.sequence,
                )
            )

        return created

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/execute/{tenant_id}")
async def execute_migrations(
    tenant_id: UUID,
    migration_service: MigrationService = Depends(get_migration_service),
    admin=Depends(get_current_admin),
) -> dict:
    """
    Execute all migrations for a tenant (in sequence order) using the execute_sql function.
    """
    try:
        await migration_service.execute_migrations(tenant_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/load_data/{tenant_id}")
async def load_data_for_tenant(
    tenant_id: UUID,
    classification_service: ClassificationService = Depends(get_classification_service),
    supabase: AsyncClient = Depends(get_async_supabase),
    admin=Depends(get_current_admin),
) -> dict:
    """
    Full data sync for a tenant:

    - Fetch all extracted files + their classifications
    - Group by classification
    - For each classification:
        * derive table name (same as migrations)
        * DELETE existing rows for that tenant
        * INSERT rows for each file in that classification
    """
    try:
        extracted_files: list[
            ExtractedFile
        ] = await classification_service.get_extracted_files(tenant_id)

        if not extracted_files:
            return {
                "status": "ok",
                "tables_updated": [],
                "message": "No extracted files found",
            }

        files_by_class_id: dict[UUID, list[ExtractedFile]] = defaultdict(list)

        for ef in extracted_files:
            if ef.classification is None:
                continue
            files_by_class_id[ef.classification.classification_id].append(ef)

        updated_tables: list[str] = []

        for class_files in files_by_class_id.values():
            classification = class_files[0].classification
            table_name = _table_name_for_classification(classification)

            await (
                supabase.table(table_name)
                .delete()
                .eq("tenant_id", str(tenant_id))
                .execute()
            )

            rows = [
                {
                    "id": str(f.extracted_file_id),
                    "tenant_id": str(tenant_id),
                    "data": f.extracted_data,
                }
                for f in class_files
            ]

            if rows:
                await supabase.table(table_name).insert(rows).execute()

            updated_tables.append(table_name)

        return {
            "status": "ok",
            "tables_updated": updated_tables,
            "message": "Data synced from extracted_files into generated tables",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/connection-url/{tenant_id}")
async def get_tenant_connection_url(
    tenant_id: UUID,
    include_public: bool = False,
    admin=Depends(get_current_admin),
) -> dict:
    """
    Get a PostgreSQL connection URL for a specific tenant.
    """
    from app.utils.tenant_connection import get_schema_name, get_tenant_connection_url

    try:
        url = get_tenant_connection_url(tenant_id, include_public)
        schema = get_schema_name(tenant_id)

        return {
            "tenant_id": str(tenant_id),
            "schema_name": schema,
            "connection_url": url,
            "includes_public_schema": include_public,
            "note": "Use this URL to connect and see only this tenant's generated tables",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
