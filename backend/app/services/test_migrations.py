# app/dev/test_migrations.py
from uuid import uuid4

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Relationship, RelationshipType
from app.services.migration_service import create_migrations


def main() -> None:
    # Fake tenant
    tenant_id = uuid4()

    # Fake classifications (these simulate 2 “tables”)
    robot_spec = Classification(
        classification_id=uuid4(),
        tenant_id=tenant_id,
        name="RobotSpecifications",
    )

    purchase_order = Classification(
        classification_id=uuid4(),
        tenant_id=tenant_id,
        name="PurchaseOrders",
    )

    # Fake relationship: many robot_specs ↔ many purchase_orders
    rel = Relationship(
        relationship_id=uuid4(),
        tenant_id=tenant_id,
        from_classification=robot_spec,
        to_classification=purchase_order,
        type=RelationshipType.MANY_TO_MANY,
    )

    # No existing migrations yet
    initial_migrations = []

    # 🔥 Call your function
    new_migrations = create_migrations(
        classifications=[robot_spec, purchase_order],
        relationships=[rel],
        initial_migrations=initial_migrations,
    )

    # Print what it produced
    print(f"Generated {len(new_migrations)} migrations:\n")
    for m in new_migrations:
        print("-----")
        print("name:", m.name)
        print("sql:")
        print(m.sql)
        print()


if __name__ == "__main__":
    main()