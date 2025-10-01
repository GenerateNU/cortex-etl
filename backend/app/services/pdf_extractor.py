from datetime import datetime


def extract_pdf_data(pdf_bytes: bytes, file_name: str) -> dict:
    """
    Pure function: Takes PDF bytes, returns extracted JSON data
    No database or storage operations - just PDF → JSON transformation

    TODO: Replace placeholder with actual PDF extraction logic
    """

    # Placeholder extraction logic
    extracted_data = {
        "source_pdf": file_name,
        "extracted_at": datetime.now().isoformat(),
        "placeholder": True,
        "data": {
            "title": f"Extracted from {file_name}",
            "content": "PDF content will be extracted here",
            "tables": [],
            "text_blocks": [],
        },
        "metadata": {
            "extractor_version": "0.1.0-placeholder",
            "file_name": file_name,
            "byte_size": len(pdf_bytes),
        },
    }

    return extracted_data
