from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.webhooks.webhook_routes import router as webhook_router
from app.api.endpoints.api_routes import router as api_router
from app.core.seed_data import seed_database
from app.core.webhooks import sync_webhooks
import os
from app.util.supabase_check import wait_for_supabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("LIFESPAN STARTING", flush=True)  # Basic print to see if this runs
    await wait_for_supabase()
    # await sync_webhooks() # TODO: Re-enable when hooks work
    if os.getenv("ENVIRONMENT") == "development":
        await seed_database()
    yield
    # Shutdown (if needed)


app = FastAPI(title="Cortex ETL API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router, prefix="/webhook")
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Cortex ETL Backend"}
