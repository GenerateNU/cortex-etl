from app.core.supabase import supabase
import logging


async def seed_database():
    """Seed initial test data"""
    try:
        # Create test tenant
        tenant = (
            await supabase.table("tenants")
            .insert({"name": "Example Corp", "is_active": True})
            .execute()
        )

        # Create test users via Supabase Auth
        admin = await supabase.auth.admin.create_user(
            {
                "email": "admin@cortex.com",
                "password": "password",
                "user_metadata": {"role": "admin"},
            }
        )

        user = await supabase.auth.admin.create_user(
            {
                "email": "user@example.com",
                "password": "password",
                "user_metadata": {
                    "role": "tenant_user",
                    "tenant_id": tenant.data[0]["id"],
                },
            }
        )

        logging.info("Database seeded")
    except Exception as e:
        logging.error(f"Seeding failed: {e}")
