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

    The returned URL contains [YOUR_PASSWORD] placeholder that must be replaced
    with the actual database password by the consuming system (Cortex).

    Args:
        tenant_id: The tenant's UUID
        include_public: If True, also include public schema in search_path

    Returns:
        Connection URL with search_path set to tenant's schema
    """
    # Get base database URL from environment (with password placeholder)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL environment variable must be set")

    # Build search_path for tenant isolation
    schema_name = get_schema_name(tenant_id)
    search_path = f"{schema_name},public" if include_public else schema_name

    # Create PostgreSQL options parameter
    options = f"-c search_path={search_path}"
    encoded_options = quote(options, safe="=,-")

    # Append options to URL
    separator = "&" if "?" in database_url else "?"
    return f"{database_url}{separator}options={encoded_options}"
