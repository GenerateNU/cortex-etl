from __future__ import annotations

from uuid import uuid4
from datetime import datetime

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Relationship, Migration, RelationshipType

def table_name_for_classification(c: Classification) -> str:
    # you can tweak this later (snake_case, prefix with tenant, etc.)
    return c.name.lower()

def create_migrations(
    classifications: list[Classification],
    relationships: list[Relationship],
    initial_migrations: list[Migration],
) -> list[Migration]:
    """
    Given:
      - classifications: what tables we conceptually want
      - relationships: how those tables relate (1-1, 1-many, many-many)
      - initial_migrations: migrations that already exist
    
    Return:
      - a *new* list of Migration objects to append on top.
    """
    existing_names = {m.name for m in initial_migrations}
    new_migrations: list[Migration] = []

    # 1) Table-creation migrations from classifications
    for c in classifications:
        table_name = table_name_for_classification(c)
        mig_name = f"create_table_{table_name}"

        if mig_name in existing_names:
            continue  # we already have this migration

        # SUPER simple example – you'll refine this:
        sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            -- minimal example: store all extracted content as JSONB
            data JSONB NOT NULL
        );
        """.strip()

        new_migrations.append(
            Migration(
                migration_id=uuid4(),
                tenant_id=c.tenant_id,
                name=mig_name,
                sql=sql,
                created_at=datetime.utcnow(),
            )
        )
        existing_names.add(mig_name)

    # 2) Relationship-based migrations (FKs / join tables)
    for rel in relationships:
        from_table = table_name_for_classification(rel.from_classification)
        to_table = table_name_for_classification(rel.to_classification)

        # Different naming per relationship type, still deterministic
        mig_name = f"rel_{rel.type.value.lower()}_{from_table}_{to_table}"

        if mig_name in existing_names:
            continue

        # VERY rough first pass: you will adjust logic + SQL later
        if rel.type == RelationshipType.ONE_TO_MANY:
            # Example: many 'from_table' rows refer to one 'to_table' row
            sql = f"""
            ALTER TABLE {from_table}
            ADD COLUMN IF NOT EXISTS {to_table}_id UUID,
            ADD CONSTRAINT fk_{from_table}_{to_table}
                FOREIGN KEY ({to_table}_id)
                REFERENCES {to_table}(id);
            """.strip()

        elif rel.type == RelationshipType.ONE_TO_ONE:
            # Could be similar to 1-many but with a UNIQUE constraint
            sql = f"""
            ALTER TABLE {from_table}
            ADD COLUMN IF NOT EXISTS {to_table}_id UUID UNIQUE,
            ADD CONSTRAINT fk_{from_table}_{to_table}
                FOREIGN KEY ({to_table}_id)
                REFERENCES {to_table}(id);
            """.strip()

        elif rel.type == RelationshipType.MANY_TO_MANY:
            # Introduce join table
            join_table = f"{from_table}_{to_table}_join"
            sql = f"""
            CREATE TABLE IF NOT EXISTS {join_table} (
                id UUID PRIMARY KEY,
                {from_table}_id UUID NOT NULL,
                {to_table}_id UUID NOT NULL,
                CONSTRAINT fk_{join_table}_{from_table}
                    FOREIGN KEY ({from_table}_id)
                    REFERENCES {from_table}(id),
                CONSTRAINT fk_{join_table}_{to_table}
                    FOREIGN KEY ({to_table}_id)
                    REFERENCES {to_table}(id),
                CONSTRAINT uniq_{join_table}
                    UNIQUE ({from_table}_id, {to_table}_id)
            );
            """.strip()
        else:
            # Fallback: just comment, so migration is still valid SQL
            sql = f"-- TODO: implement SQL for relationship {mig_name}"

        new_migrations.append(
            Migration(
                migration_id=uuid4(),
                tenant_id=rel.tenant_id,
                name=mig_name,
                sql=sql,
                created_at=datetime.utcnow(),
            )
        )
        existing_names.add(mig_name)

    return new_migrations