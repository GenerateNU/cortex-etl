# app/utils/migrations.py

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Migration, MigrationCreate
from app.schemas.relationship_schemas import Relationship


def _table_name_for_classification(c: Classification) -> str:
    """
    Deterministic mapping from classification name to SQL table name.
    Example: "Robot Specifications" -> "robotspecifications"
    """
    return c.name.replace(" ", "").lower()


def _get_schema_name(tenant_id) -> str:
    """
    Generate schema name from tenant_id.
    Example: tenant_7b21599b_3518_401e_a70a_5fe28d4000e3
    """
    return f"tenant_{str(tenant_id).replace('-', '_')}"


def create_migrations(
    classifications: list[Classification],
    relationships: list[Relationship],
    initial_migrations: list[Migration],
) -> list[MigrationCreate]:
    """
    PURE FUNCTION.

    Given:
      - classifications: what tables we conceptually want
      - relationships: how those tables relate (1-1, 1-many, many-many)
      - initial_migrations: migrations that already exist in DB

    Returns:
      - list[MigrationCreate] = new migrations to append on top

    NOW WITH SCHEMA-PER-TENANT:
      - First migration creates the tenant schema
      - All tables are created within that schema
    """
    if not classifications:
        return []

    existing_names = {m.name for m in initial_migrations}

    # Determine the next sequence number
    base_sequence = max((m.sequence for m in initial_migrations), default=0)
    next_seq = base_sequence + 1

    new_migrations: list[MigrationCreate] = []

    # All classifications belong to the same tenant
    tenant_id = classifications[0].tenant_id
    schema_name = _get_schema_name(tenant_id)

    # ===== STEP 1: CREATE SCHEMA =====
    schema_migration_name = f"create_schema_{schema_name}"

    if schema_migration_name not in existing_names:
        new_migrations.append(
            MigrationCreate(
                tenant_id=tenant_id,
                name=schema_migration_name,
                sql=f"CREATE SCHEMA IF NOT EXISTS {schema_name};",
                sequence=next_seq,
            )
        )
        existing_names.add(schema_migration_name)
        next_seq += 1

    # ===== STEP 2: CREATE TABLES (in tenant schema) =====
    for c in classifications:
        table_name = _table_name_for_classification(c)
        qualified_table_name = f"{schema_name}.{table_name}"
        mig_name = f"create_table_{schema_name}_{table_name}"

        if mig_name in existing_names:
            continue

        sql = f"""
        CREATE TABLE IF NOT EXISTS {qualified_table_name} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
        """.strip()

        new_migrations.append(
            MigrationCreate(
                tenant_id=c.tenant_id,
                name=mig_name,
                sql=sql,
                sequence=next_seq,
            )
        )
        existing_names.add(mig_name)
        next_seq += 1

    # ===== STEP 3: CREATE RELATIONSHIPS (in tenant schema) =====
    for rel in relationships:
        from_table = _table_name_for_classification(rel.from_classification)
        to_table = _table_name_for_classification(rel.to_classification)

        qualified_from = f"{schema_name}.{from_table}"
        qualified_to = f"{schema_name}.{to_table}"

        # Support both Enum and plain string for rel.type
        rel_type = getattr(rel.type, "value", rel.type)

        mig_name = f"rel_{rel_type.lower()}_{schema_name}_{from_table}_{to_table}"

        if mig_name in existing_names:
            continue

        if rel_type == "ONE_TO_MANY":
            sql = f"""
        ALTER TABLE {qualified_from}
        ADD COLUMN IF NOT EXISTS {to_table}_id UUID,
        ADD CONSTRAINT fk_{schema_name}_{from_table}_{to_table}
            FOREIGN KEY ({to_table}_id)
            REFERENCES {qualified_to}(id);
                    """.strip()

        elif rel_type == "ONE_TO_ONE":
            sql = f"""
                ALTER TABLE {qualified_from}
                ADD COLUMN IF NOT EXISTS {to_table}_id UUID UNIQUE,
                ADD CONSTRAINT fk_{schema_name}_{from_table}_{to_table}
                    FOREIGN KEY ({to_table}_id)
                    REFERENCES {qualified_to}(id);
                            """.strip()

        elif rel_type == "MANY_TO_MANY":
            join_table = f"{from_table}_{to_table}_join"
            qualified_join = f"{schema_name}.{join_table}"

            sql = f"""
            CREATE TABLE IF NOT EXISTS {qualified_join} (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                {from_table}_id UUID NOT NULL,
                {to_table}_id UUID NOT NULL,
                CONSTRAINT fk_{schema_name}_{join_table}_{from_table}
                    FOREIGN KEY ({from_table}_id)
                    REFERENCES {qualified_from}(id),
                CONSTRAINT fk_{schema_name}_{join_table}_{to_table}
                    FOREIGN KEY ({to_table}_id)
                    REFERENCES {qualified_to}(id),
                CONSTRAINT uniq_{schema_name}_{join_table}
                    UNIQUE ({from_table}_id, {to_table}_id)
            );
            """.strip()
        else:
            sql = f"-- TODO: implement SQL for relationship {mig_name}"

        new_migrations.append(
            MigrationCreate(
                tenant_id=rel.tenant_id,
                name=mig_name,
                sql=sql,
                sequence=next_seq,
            )
        )
        existing_names.add(mig_name)
        next_seq += 1

    return new_migrations
