from app.core.supabase import supabase


async def seed_database():
    # Check if already seeded
    existing = supabase.table("tenants").select("count", count="exact").execute()
    if existing.count > 0:
        print("Database already seeded", flush=True)
        print("Login credentials:", flush=True)
        print("Admin: admin@cortex.com / password", flush=True)
        print("Tenant: user@example.com / password", flush=True)
        return

    print("Creating tenant...", flush=True)
    tenant = (
        supabase.table("tenants")
        .insert({"name": "Example Corp", "is_active": True})
        .execute()
    )
    tenant_id = tenant.data[0]["id"]
    print(f"Created tenant: {tenant_id}", flush=True)

    print("Creating admin user...", flush=True)
    admin_user = supabase.auth.admin.create_user(
        {
            "email": "admin@cortex.com",
            "password": "password",
            "email_confirm": True,  # Skip email confirmation
        }
    )
    print(f"Created admin user: {admin_user.user.id}", flush=True)

    print("Creating tenant user...", flush=True)
    tenant_user = supabase.auth.admin.create_user(
        {
            "email": "user@example.com",
            "password": "password",
            "email_confirm": True,  # Skip email confirmation
        }
    )
    print(f"Created tenant user: {tenant_user.user.id}", flush=True)

    print("Creating profiles...", flush=True)
    supabase.table("profiles").insert(
        {
            "id": admin_user.user.id,
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "tenant_id": None,
        }
    ).execute()

    supabase.table("profiles").insert(
        {
            "id": tenant_user.user.id,
            "first_name": "Tenant",
            "last_name": "User",
            "role": "tenant",
            "tenant_id": tenant_id,
        }
    ).execute()

    print("Database seeded successfully", flush=True)
    print("Login credentials:", flush=True)
    print("Admin: admin@cortex.com / password", flush=True)
    print("Tenant: user@example.com / password", flush=True)
