import os

from supabase import Client, create_client

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)
