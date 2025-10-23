import os

from supabase import AsyncClient, acreate_client

supabase: AsyncClient | None = None


async def get_async_supabase() -> AsyncClient:
    global supabase
    if supabase is None:
        supabase = await acreate_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
        print("Supabase Initialized")
    return supabase
