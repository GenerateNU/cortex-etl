# app/utils/tenant_connection.py

import os
from urllib.parse import quote
from uuid import UUID


def get_schema_name(tenant_id: UUID) -> str:
    """
    Generate schema name from tenant_id.

    Example:
        tenant_id: 7b21599b-3518-401e-a70a-5fe28d4000e3
        returns: tenant_7b21599b_3518_401e_a70a_5fe28d4000e3
    """
    return f"tenant_{str(tenant_id).replace('-', '_')}"


def get_tenant_connection_url(tenant_id: UUID, include_public: bool = False) -> str:
    """
    Generate a PostgreSQL connection URL scoped to a specific tenant's schema.

    Args:
        tenant_id: The tenant's UUID
        include_public: If True, also include public schema in search_path
                       (allows access to shared tables like tenants, users)

    Returns:
        Connection URL with search_path set to tenant's schema

    Example output:
        postgresql://postgres:postgres@localhost:54322/postgres?options=-c%20search_path%3Dtenant_abc123
    """
    # Get base database URL from environment
    # For local Supabase, this should be the direct postgres connection
    database_url = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/postgres"
    )

    schema_name = get_schema_name(tenant_id)

    # Build search_path
    if include_public:
        # Tenant schema first, then public as fallback
        search_path = f"{schema_name},public"
    else:
        # Only tenant schema (complete isolation)
        search_path = schema_name

    # Create PostgreSQL connection option
    # -c sets a configuration parameter
    # search_path controls which schemas are visible
    options = f"-c search_path={search_path}"

    # URL encode the options (spaces become %20, etc.)
    encoded_options = quote(options, safe="=,-")

    # Append options to URL
    separator = "&" if "?" in database_url else "?"
    return f"{database_url}{separator}options={encoded_options}"
