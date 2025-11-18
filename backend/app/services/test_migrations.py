# app/services/test_async_apply_migrations.py
import asyncio
from uuid import uuid4

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Relationship, RelationshipType, Migration
from app.services.migration_service import create_migrations, apply_migrations


async def main():
    tenant_id = uuid4()  # in real life you'd use a real tenant_id from your DB

    # --- WAVE 1: initial classifications + relationship ---

    c_robot = Classification(
        classification_id=uuid4(),
        tenant_id=tenant_id,
        name="RobotSpecifications",
    )
    c_po = Classification(
        classification_id=uuid4(),
        tenant_id=tenant_id,
        name="PurchaseOrders",
    )

    rel_robot_po = Relationship(
        relationship_id=uuid4(),
        tenant_id=tenant_id,
        from_classification=c_robot,
        to_classification=c_po,
        type=RelationshipType.MANY_TO_MANY,
    )

    print("=== WAVE 1: creating initial migrations ===")
    migrations_wave1: list[Migration] = create_migrations(
        classifications=[c_robot, c_po],
        relationships=[rel_robot_po],
        initial_migrations=[],  # first run: nothing yet
    )

    for m in migrations_wave1:
        print(f"- {m.name}")

    # Apply them to Supabase (creates tables + join table)
    await apply_migrations(migrations_wave1)

    # --- WAVE 2: add more data (new classification + new relationship) ---

    c_invoice = Classification(
        classification_id=uuid4(),
        tenant_id=tenant_id,
        name="Invoices",
    )

    # Example: one PurchaseOrder can have many Invoices (or flip it if you want)
    rel_po_invoice = Relationship(
        relationship_id=uuid4(),
        tenant_id=tenant_id,
        from_classification=c_po,
        to_classification=c_invoice,
        type=RelationshipType.ONE_TO_MANY,
    )

    print("\n=== WAVE 2: adding new classification + relationship ===")
    # Now we pass migrations_wave1 as initial_migrations
    migrations_wave2: list[Migration] = create_migrations(
        classifications=[c_robot, c_po, c_invoice],
        relationships=[rel_robot_po, rel_po_invoice],
        initial_migrations=migrations_wave1,
    )

    for m in migrations_wave2:
        print(f"- {m.name}")

    # Apply only the *new* migrations (e.g. create_table_invoices + rel_one_to_many_purchaseorders_invoices)
    await apply_migrations(migrations_wave2)


if __name__ == "__main__":
    asyncio.run(main())