from uuid import UUID

from app.core.supabase import supabase
from app.utils.preprocess.embeddings import generate_embedding
from app.utils.preprocess.pdf_extractor import extract_pdf_data


class PreprocessService:
    async def process_pdf_upload(self, file_upload_id: UUID) -> str:
        """
        Full preprocessing pipeline:
        1. Download PDF from storage
        2. Extract structured data
        3. Generate embedding
        4. Store in extracted_files
        """

        response = (
            supabase.table("file_uploads")
            .select("tenant_id, name")
            .eq("id", file_upload_id)
            .single()
            .execute()
        )

        tenant_id = response.data["tenant_id"]
        file_name = response.data["name"]

        storage_path = f"{tenant_id}/{file_name}"

        # Download PDF
        pdf_bytes = supabase.storage.from_("documents").download(storage_path)
        print("PDF downloaded", flush=True)

        # Extract data
        extracted_json = extract_pdf_data(pdf_bytes, file_name)
        print("Data extracted", flush=True)

        # Generate embedding for whole document
        embedding_vector = await generate_embedding(extracted_json)
        print("Embedding generated", flush=True)

        # Store extraction with embedding
        result = (
            supabase.table("extracted_files")
            .insert(
                {
                    "source_file_id": str(file_upload_id),
                    "extracted_data": extracted_json,
                    "embedding": embedding_vector,
                }
            )
            .execute()
        )

        print("Extraction stored", flush=True)
        return result.data[0]["id"]

    async def delete_previous_extraction(self, file_upload_id: UUID):
        """
        Delete Previous extracted data entry if one exists
        """

        supabase.table("extracted_files").delete().eq(
            "source_file_id", file_upload_id
        ).execute()


def get_preprocess_service():
    return PreprocessService()
