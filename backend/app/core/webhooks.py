from app.core.supabase import supabase
import httpx
import os

# Storage webhooks (handled by Supabase Management API)
STORAGE_WEBHOOKS = {
    "pdf_extraction": {
        "filter": "storage/objects/create",
        "endpoint": "/webhook/extract-pdf",
        "condition": lambda obj: obj.get("name", "").endswith(".pdf"),
    },
    # Add more storage webhooks here:
    # "csv_upload": {
    #     "filter": "storage/objects/create",
    #     "endpoint": "/webhook/process-csv",
    #     "condition": lambda obj: obj.get("name", "").endswith('.csv')
    # }
}

# Database webhooks (custom triggers on public tables)
DATABASE_WEBHOOKS = {
    # Add database webhooks here:
    # "tenant_update": {
    #     "table": "public.tenants",
    #     "event": "UPDATE",
    #     "condition": "NEW.is_active != OLD.is_active",
    #     "endpoint": "/webhook/tenant-changed"
    # }
}


async def sync_webhooks():
    """Sync both storage and database webhooks"""
    await sync_storage_webhooks()
    await sync_database_webhooks()


async def sync_storage_webhooks():
    """Create storage webhooks via Supabase Management API"""
    webhook_base_url = os.getenv(
        "BACKEND_WEBHOOK_URL", "http://host.docker.internal:8000"
    )
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    for name, config in STORAGE_WEBHOOKS.items():
        webhook_config = {
            "type": "HTTP",
            "filter": config["filter"],
            "config": {
                "url": f"{webhook_base_url}{config['endpoint']}",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
            },
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{supabase_url}/rest/v1/hooks",
                    json=webhook_config,
                    headers={
                        "Authorization": f"Bearer {service_key}",
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code in [200, 201]:
                    print(f"Storage webhook {name} synced", flush=True)
                else:
                    print(f"Storage webhook {name} failed: {response.text}", flush=True)
        except Exception as e:
            print(f"Storage webhook {name} sync failed: {e}", flush=True)


async def sync_database_webhooks():
    """Create database triggers for webhooks"""
    backend_url = os.getenv("BACKEND_WEBHOOK_URL", "http://host.docker.internal:8000")

    for name, config in DATABASE_WEBHOOKS.items():
        trigger_sql = f"""
        CREATE OR REPLACE FUNCTION webhook_{name}()
        RETURNS TRIGGER AS $$
        BEGIN
            IF {config['condition']} THEN
                PERFORM extensions.http_post(
                    '{backend_url}{config['endpoint']}',
                    json_build_object(
                        'type', '{config['event']}',
                        'record', row_to_json(NEW)
                    )::text,
                    'application/json'
                );
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS on_{name} ON {config['table']};
        CREATE TRIGGER on_{name}
        AFTER {config['event']} ON {config['table']}
        FOR EACH ROW EXECUTE FUNCTION webhook_{name}();
        """

        try:
            supabase.rpc("exec_sql", {"sql": trigger_sql}).execute()
            print(f"Database webhook {name} synced", flush=True)
        except Exception as e:
            print(f"Database webhook {name} sync failed: {e}", flush=True)
