from app.core.supabase import supabase
import logging
import asyncio


async def create_user_with_retry(user_data, max_retries=50):
    for attempt in range(max_retries):
        try:
            return supabase.auth.admin.create_user(user_data)
        except Exception as e:
            if "already registered" in str(e):
                logging.info(f"User {user_data['email']} already exists")
                return None
            if attempt == max_retries - 1:
                raise
            logging.info(f"Auth retry {attempt + 1}/{max_retries}: {e}")
            await asyncio.sleep(3)


async def seed_database():
    # Check if already seeded
    existing = supabase.table("tenants").select("count", count="exact").execute()
    if existing.count > 0:
        logging.info("Database already seeded")
        return

    # Create tenant
    tenant = (
        supabase.table("tenants")
        .insert({"name": "Example Corp", "is_active": True})
        .execute()
    )

    # Create users with retry
    await create_user_with_retry(
        {
            "email": "admin@cortex.com",
            "password": "password",
            "user_metadata": {"role": "admin"},
        }
    )

    await create_user_with_retry(
        {
            "email": "user@example.com",
            "password": "password",
            "user_metadata": {"role": "tenant", "tenant_id": tenant.data[0]["id"]},
        }
    )

    logging.info("Database seeded successfully")


async def wait_for_auth_service():
    max_retries = 20  # Increase from 10
    for attempt in range(max_retries):
        try:
            supabase.auth.admin.list_users()
            logging.info("Auth service ready")
            return
        except Exception as e:
            if attempt == max_retries - 1:
                raise Exception(
                    f"Auth service not ready after {max_retries} attempts: {e}"
                )
            logging.info(f"Waiting for auth service... ({attempt + 1}/{max_retries})")
            await asyncio.sleep(3)  # Increase from 2
