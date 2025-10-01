from app.core.supabase import supabase


def print_credentials():
    """Print all login credentials in a formatted way"""
    print("\nLogin credentials:", flush=True)
    print("=" * 50, flush=True)
    print("Admin: admin@cortex.com / password", flush=True)
    print("\nKawasaki Robotics:", flush=True)
    print("  - eng@kawasaki-robotics.com / password", flush=True)
    print("\nKuka AG:", flush=True)
    print("  - eng@kuka.com / password", flush=True)
    print("\nStaubli:", flush=True)
    print("  - eng@staubli.com / password", flush=True)
    print("\nMilara Incorporated:", flush=True)
    print("  - eng@milara.com / password", flush=True)
    print("=" * 50, flush=True)


async def seed_database():
    # Check if already seeded
    existing = supabase.table("tenants").select("count", count="exact").execute()
    if existing.count > 0:
        print("Database already seeded", flush=True)
        print_credentials()
        return

    # Create tenants
    companies = ["Kawasaki Robotics", "Kuka AG", "Staubli", "Milara Incorporated"]

    tenant_ids = {}
    for company in companies:
        print(f"Creating tenant: {company}...", flush=True)
        tenant = (
            supabase.table("tenants")
            .insert({"name": company, "is_active": True})
            .execute()
        )
        tenant_ids[company] = tenant.data[0]["id"]
        print(f"Created tenant {company}: {tenant_ids[company]}", flush=True)

    # Create admin user
    print("Creating admin user...", flush=True)
    admin_user = supabase.auth.admin.create_user(
        {
            "email": "admin@cortex.com",
            "password": "password",
            "email_confirm": True,
        }
    )
    print(f"Created admin user: {admin_user.user.id}", flush=True)

    supabase.table("profiles").insert(
        {
            "id": admin_user.user.id,
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "tenant_id": None,
        }
    ).execute()

    # Create one user per company
    tenant_users = [
        ("eng@kawasaki-robotics.com", "Engineering", "Lead", "Kawasaki Robotics"),
        ("eng@kuka.com", "Technical", "Specialist", "Kuka AG"),
        ("eng@staubli.com", "Application", "Engineer", "Staubli"),
        ("eng@milara.com", "Project", "Engineer", "Milara Incorporated"),
    ]

    for email, first_name, last_name, company in tenant_users:
        print(f"Creating user: {email}...", flush=True)
        user = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": "password",
                "email_confirm": True,
            }
        )
        print(f"Created user: {user.user.id}", flush=True)

        supabase.table("profiles").insert(
            {
                "id": user.user.id,
                "first_name": first_name,
                "last_name": last_name,
                "role": "tenant",
                "tenant_id": tenant_ids[company],
            }
        ).execute()

    print("Database seeded successfully", flush=True)
    print_credentials()
