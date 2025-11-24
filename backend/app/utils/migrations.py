# app/utils/migrations.py

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Migration, MigrationCreate
from app.schemas.relationship_schemas import Relationship


def _table_name_for_classification(c: Classification) -> str:
    """
    Deterministic mapping from classification name to SQL table name.
    Example: "Robot Specifications" -> "robotspecifications"
    You can make this smarter later (snake_case, etc).
    """
    return c.name.replace(" ", "").lower()


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
    """
    existing_names = {m.name for m in initial_migrations}

    # determine the next sequence number
    base_sequence = max((m.sequence for m in initial_migrations), default=0)
    next_seq = base_sequence + 1

    new_migrations: list[MigrationCreate] = []

    # 1) Table-creation migrations from classifications
    for c in classifications:
        table_name = _table_name_for_classification(c)
        mig_name = f"create_table_{table_name}"

        if mig_name in existing_names:
            # migration already exists, skip
            continue

        sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            -- minimal example: store all extracted content as JSONB
            data JSONB NOT NULL
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

    # 2) Relationship-based migrations (FKs / join tables)
    for rel in relationships:
        from_table = _table_name_for_classification(rel.from_classification)
        to_table = _table_name_for_classification(rel.to_classification)

        # Support both Enum and plain string for rel.type
        rel_type = getattr(rel.type, "value", rel.type)

        mig_name = f"rel_{rel_type.lower()}_{from_table}_{to_table}"

        if mig_name in existing_names:
            continue

        if rel_type == "ONE_TO_MANY":
            sql = f"""
            ALTER TABLE {from_table}
            ADD COLUMN IF NOT EXISTS {to_table}_id UUID,
            ADD CONSTRAINT fk_{from_table}_{to_table}
                FOREIGN KEY ({to_table}_id)
                REFERENCES {to_table}(id);
            """.strip()

        elif rel_type == "ONE_TO_ONE":
            sql = f"""
            ALTER TABLE {from_table}
            ADD COLUMN IF NOT EXISTS {to_table}_id UUID UNIQUE,
            ADD CONSTRAINT fk_{from_table}_{to_table}
                FOREIGN KEY ({to_table}_id)
                REFERENCES {to_table}(id);
            """.strip()

        elif rel_type == "MANY_TO_MANY":
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
