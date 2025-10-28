import json
import httpx
from app.core.litellm import LLMClient, ModelType

model = LLMClient()
model.set_system_prompt(
    "You are a PDF→JSON structurer for manufacturing/robotics documents. "
    "Return ONE valid JSON object only (no markdown). Keep only meaningful specs "
    "(manufacturer, model, document identifiers, key specs like payload/reach/"
    "repeatability/mass/mounting/protection/environment, axis JT1..JTn ranges & speeds). "
    "Preserve symbols like ±, °/s, φ. Normalize ranges as strings (e.g., '±180', '+140 to -105'). "
    "Do not invent values; omit if missing."
)

async def extract_with_docling(pdf_bytes: bytes) -> str:
    """Extract text from PDF using Docling API."""
    try:
        pdf_size_mb = len(pdf_bytes) / (1024 * 1024)
        print(f"PDF size: {pdf_size_mb:.2f} MB", flush=True)
        
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(300.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        ) as client:
            files = {"file": ("document.pdf", pdf_bytes, "application/pdf")}
            response = await client.post(
                "http://host.docker.internal:8001/documents/convert",
                files=files
            )
            response.raise_for_status()
            result = response.json()
            return result.get("markdown", "") or result.get("content", "")
    except Exception as e:
        print(f"Docling extraction error: {type(e).__name__}: {str(e)}", flush=True)
        raise

async def extract_pdf_data(
    pdf_bytes: bytes,
    file_name: str,
    llm_model: ModelType = ModelType.GEMINI_PRO,
) -> dict:
    
    try:
        print("Extracting with Docling...", flush=True)
        docling_text = await extract_with_docling(pdf_bytes)
        print(f"Docling extracted {len(docling_text)} characters", flush=True)
        
        print("Structuring with Gemini...", flush=True)
        model.set_model(llm_model)
        response = await model.chat(
            f"Structure this extracted PDF content into JSON:\n\n{docling_text}",
            json_response=True
        )
        text = response.choices[0].message.content.strip()
        
        print("Extraction complete", flush=True)
        
        data = json.loads(text)
    except Exception as e:
        print(f"Extraction failed: {type(e).__name__}: {str(e)}", flush=True)
        data = {"error": f"{type(e).__name__}: {str(e)}"}

    return {
        "file_name": file_name,
        "result": data,
        "meta": {"llm_model": llm_model.value, "source": "docling+gemini"},
    }