from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.user import User, UserRole


def seed_database():
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded")
        db.close()
        return

    # Create tenant
    example_tenant = Tenant(
        name="Example Corp", schema_name="example_corp", is_active=True
    )
    db.add(example_tenant)
    db.commit()
    db.refresh(example_tenant)

    # Create admin
    admin = User(
        email="admin@cortex.com",
        hashed_password=get_password_hash("password"),
        full_name="System Admin",
        role=UserRole.ADMIN,
        tenant_id=None,
    )
    db.add(admin)

    # Create tenant user
    user = User(
        email="user@example.com",
        hashed_password=get_password_hash("password"),
        full_name="Example User",
        role=UserRole.TENANT_USER,
        tenant_id=example_tenant.id,
    )
    db.add(user)

    db.commit()
    print("✅ Database seeded")
    db.close()


if __name__ == "__main__":
    seed_database()
