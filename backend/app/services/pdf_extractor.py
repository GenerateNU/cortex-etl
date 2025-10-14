class PDFExtractor:
    """
    Unified PDF → JSON extractor (Docling + pdfplumber + optional Gemini)
    """
    def __init__(self, pdf_path: Path):
        self.pdf_path = pdf_path
        self.docling_data = None
        self.plumber_data = None
        self.concise_data = None
    
    # Docling extraction
    def extract_docling(self):
        ...
    # pdfplumber extraction
    def extract_pdfplumber(self):
        ...
    # LLM / Gemini
    def structure_with_gemini(self, model: str):
        ...
    # Save JSON
    def save_json(self, out_dir: Path):
        ...