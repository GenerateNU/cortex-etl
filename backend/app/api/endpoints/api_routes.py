from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_admin, get_current_user
from app.core.supabase import supabase
from app.services.etl_processor import start_etl_process
from app.services.pdf_extractor import extract_pdf_data

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        supabase.table("tenants").select("count", count="exact").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@router.post("/extract_data/{file_id}")
async def process_pdf(file_id: str, user=Depends(get_current_user)):
    """
    Process a PDF file: extract data and store as JSON
    Called by frontend after file upload
    """
    try:
        file_result = (
            supabase.table("file_uploads").select("*").eq("id", file_id).execute()
        )

        if not file_result.data:
            raise HTTPException(status_code=404, detail="File not found")

        file_record = file_result.data[0]

        if not file_record["name"].lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File is not a PDF")

        is_admin = user["user_metadata"]["role"] == "admin"
        owns_file = file_record["tenant_id"] == user["user_metadata"]["tenant_id"]

        if not is_admin and not owns_file:
            raise HTTPException(status_code=403, detail="File does not belong to user")

        pdf_path = f"{file_record['tenant_id']}/{file_record['name']}"
        pdf_bytes = supabase.storage.from_(file_record["bucket_id"]).download(pdf_path)

        extracted_json = extract_pdf_data(pdf_bytes, file_record["name"])

        extraction_result = (
            supabase.table("extracted_files")
            .insert({"source_file_id": file_id, "extracted_data": extracted_json})
            .execute()
        )

        return {
            "status": "success",
            "extraction_id": extraction_result.data[0]["id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        print(f"Processing failed: {error_message}", flush=True)

        raise HTTPException(
            status_code=500, detail=f"Processing failed: {error_message}"
        )


@router.post("/process")
async def process_etl(tenant_id: str, admin=Depends(get_current_admin)):
    """Start ETL process for a tenant"""
    result = await start_etl_process(tenant_id)
    return result
