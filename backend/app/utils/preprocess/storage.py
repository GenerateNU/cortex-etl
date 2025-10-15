from app.core.supabase import supabase


def download_pdf_from_storage(storage_path: str) -> bytes:
    """Download PDF from Supabase storage"""
    return supabase.storage.from_("documents").download(storage_path)
