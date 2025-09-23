from app.core.supabase import supabase
import json
from datetime import datetime


async def extract_pdf(bucket: str, file_name: str, tenant_id: str):
    """Placeholder PDF extraction logic"""
    # TODO: Implement actual PDF extraction

    json_name = file_name.replace(".pdf", ".json")

    extracted_data = {
        "source_pdf": file_name,
        "tenant_id": tenant_id,
        "extracted_at": datetime.now().isoformat(),
        "placeholder": "This is placeholder data for PDF extraction",
        "data": {
            "title": f"Extracted from {file_name}",
            "content": "PDF content will be extracted here",
        },
    }

    # Store JSON in same location as PDF
    path = f"{tenant_id}/{json_name}"
    supabase.storage.from_(bucket).upload(
        path, json.dumps(extracted_data).encode(), {"content-type": "application/json"}
    )

    return {
        "status": "success",
        "pdf": file_name,
        "json": json_name,
        "message": f"Extracted data stored as {json_name}",
    }
