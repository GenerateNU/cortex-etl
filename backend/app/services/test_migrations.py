# app/services/test_async_apply_migrations.py
import asyncio
from uuid import uuid4

from app.schemas.classification_schemas import Classification
from app.schemas.migration_schemas import Relationship, RelationshipType, Migration
from app.services.migration_service import create_migrations, apply_migrations


async def main():
    tenant_id = uuid4()

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

    rel = Relationship(
        relationship_id=uuid4(),
        tenant_id=tenant_id,
        from_classification=c_robot,
        to_classification=c_po,
        type=RelationshipType.MANY_TO_MANY,
    )

    new_migrations = create_migrations(
        classifications=[c_robot, c_po],
        relationships=[rel],
        initial_migrations=[],  # first run: nothing yet
    )

    await apply_migrations(new_migrations)


if __name__ == "__main__":
    asyncio.run(main())