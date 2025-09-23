from app.core.supabase import supabase
import logging
import os

WEBHOOK_CONFIG = {
    "pdf_extraction": {
        "table": "storage.objects",
        "event": "INSERT",
        "condition": "NEW.name LIKE '%.pdf'",
        "endpoint": "/webhook/extract-pdf",
    },
    # Add more webhooks here as needed
    # "csv_upload": {
    #     "table": "storage.objects",
    #     "event": "INSERT",
    #     "condition": "NEW.name LIKE '%.csv'",
    #     "endpoint": "/webhook/process-csv"
    # }
}


async def sync_webhooks():
    """Create database triggers for webhooks"""
    backend_url = os.getenv("BACKEND_URL", "http://host.docker.internal:8001")

    for name, config in WEBHOOK_CONFIG.items():
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
            await supabase.rpc("exec_sql", {"sql": trigger_sql}).execute()
            logging.info(f"Webhook {name} synced")
        except Exception as e:
            logging.error(f"Webhook {name} sync failed: {e}")
