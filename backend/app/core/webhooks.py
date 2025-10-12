import os
from app.core.supabase import supabase


async def configure_webhooks():
    """Configure webhook settings in database on startup"""
    webhook_base_url = os.getenv("WEBHOOK_BASE_URL")
    webhook_secret = os.getenv("WEBHOOK_SECRET")

    if not webhook_base_url or not webhook_secret:
        print("⚠️  WARNING: Webhook configuration missing. File extraction disabled.")
        print("    Set WEBHOOK_BASE_URL and WEBHOOK_SECRET in .env")
        return

    try:
        webhook_url = f"{webhook_base_url}/api/webhooks/extract_data"

        supabase.rpc(
            "update_webhook_config", {"url": webhook_url, "secret": webhook_secret}
        ).execute()

        print(f"✓ Webhook configured: {webhook_url}")
    except Exception as e:
        print(f"✗ Failed to configure webhook: {e}")
