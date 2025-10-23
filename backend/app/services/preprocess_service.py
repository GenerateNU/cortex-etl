from uuid import UUID

from fastapi import Depends
from supabase import AsyncClient

from app.core.supabase import get_async_supabase
from app.utils.preprocess.embeddings import generate_embedding
from app.utils.preprocess.pdf_extractor import extract_pdf_data


class PreprocessService:
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def created_queued_extraction(self, file_upload_id: UUID) -> UUID:
        """
        Created an extracted_files entry with status "queued" and returns the extracted_file_id
        """

        result = await (
            self.supabase.table("extracted_files")
            .insert(
                {
                    "status": "queued",
                    "source_file_id": str(file_upload_id),
                }
            )
            .execute()
        )

        return result.data[0]["id"]

    async def process_pdf_upload(self, extracted_file_id: UUID) -> str:
        """
        Full preprocessing pipeline:
        1. Download PDF from storage
        2. Extract structured data
        3. Generate embedding
        4. Store in extracted_files
        """
        try:
            # Update status to "processing"
            await (
                self.supabase.table("extracted_files")
                .update({"status": "processing"})
                .eq("id", str(extracted_file_id))
                .execute()
            )

            response = await (
                self.supabase.table("extracted_files")
                .select("file_uploads!inner(name, tenant_id)")
                .eq("id", str(extracted_file_id))
                .single()
                .execute()
            )

            tenant_id = response.data["file_uploads"]["tenant_id"]
            file_name = response.data["file_uploads"]["name"]

            storage_path = f"{tenant_id}/{file_name}"

            # Download PDF
            pdf_bytes = await self.supabase.storage.from_("documents").download(
                storage_path
            )
            print("PDF downloaded", flush=True)

            # Extract data
            extracted_json = await extract_pdf_data(pdf_bytes, file_name)
            print("Data extracted", flush=True)

            # Generate embedding for whole document
            embedding_vector = await generate_embedding(extracted_json)
            print("Embedding generated", flush=True)

            # Update status to "complete" with extracted data and embedding
            result = await (
                self.supabase.table("extracted_files")
                .update(
                    {
                        "status": "completed",
                        "extracted_data": extracted_json,
                        "embedding": embedding_vector,
                    }
                )
                .eq("id", str(extracted_file_id))
                .execute()
            )

            print("Extraction stored", flush=True)
            return result.data[0]["id"]
        except Exception as e:
            # Update status to "failed" and store error
            await (
                self.supabase.table("extracted_files")
                .update({"status": "failed", "extracted_data": {"error": str(e)}})
                .eq("id", str(extracted_file_id))
                .execute()
            )
            raise

    async def delete_previous_extraction(self, file_upload_id: UUID):
        """
        Delete Previous extracted data entry if one exists
        """

        await (
            self.supabase.table("extracted_files")
            .delete()
            .eq("source_file_id", str(file_upload_id))
            .execute()
        )


def get_preprocess_service(
    supabase: AsyncClient = Depends(get_async_supabase),
) -> PreprocessService:
    """Instantiates a PreprocessService object in route parameters"""
    print("Created Preprocess Service")
    return PreprocessService(supabase)
