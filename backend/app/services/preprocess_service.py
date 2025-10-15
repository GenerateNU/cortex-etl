from app.core.supabase import supabase
from app.schemas.webhook_schemas import PDFUploadWebhookPayload
from app.utils.preprocess.embeddings import generate_embedding
from app.utils.preprocess.pdf_extractor import extract_pdf_data
from app.utils.preprocess.storage import download_pdf_from_storage


async def process_pdf_upload(payload: PDFUploadWebhookPayload) -> str:
    """
    Full preprocessing pipeline:
    1. Download PDF from storage
    2. Extract structured data
    3. Generate embedding
    4. Store in extracted_files
    """

    # Download PDF
    pdf_bytes = download_pdf_from_storage(payload.storage_path)
    print("PDF downloaded", flush=True)

    # Extract data
    extracted_json = extract_pdf_data(pdf_bytes, payload.filename)
    print("Data extracted", flush=True)

    # Generate embedding for whole document
    embedding_vector = await generate_embedding(extracted_json)
    print("Embedding generated", flush=True)

    # Store extraction with embedding
    result = (
        supabase.table("extracted_files")
        .insert(
            {
                "source_file_id": str(payload.file_upload_id),
                "extracted_data": extracted_json,
                "embedding": embedding_vector,
            }
        )
        .execute()
    )

    print("Extraction stored", flush=True)
    return result.data[0]["id"]
