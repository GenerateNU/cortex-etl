import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.seed_data import seed_database
from app.core.webhooks import configure_webhooks
from app.util.supabase_check import wait_for_supabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("LIFESPAN STARTING", flush=True)
    await wait_for_supabase()

    await configure_webhooks()

    if os.getenv("ENVIRONMENT") == "development":
        await seed_database()

    yield
    # Shutdown (if needed)


app = FastAPI(title="Cortex ETL API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "Cortex ETL Backend"}
