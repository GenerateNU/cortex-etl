import io
import os
import re
import json
import requests
from datetime import datetime
from typing import Dict, Any
from app.core.litellm import LLMClient, ModelType


# ===== Configuration =====
DOCLING_API_URL = "http://host.docker.internal:8080/documents/convert"

model = LLMClient()
model.set_system_prompt(
    "You are a PDF→JSON structurer for manufacturing/robotics documents. "
    "Return ONE valid JSON object only (no markdown). Keep only meaningful specs "
    "(manufacturer, model, document identifiers, key specs like payload/reach/"
    "repeatability/mass/mounting/protection/environment, axis JT1..JTn ranges & speeds). "
    "Preserve symbols like ±, °/s, φ. Normalize ranges as strings (e.g., '±180', '+140 to -105'). "
    "Do not invent values; omit if missing."
)


def extract_pdf_data(
    pdf_bytes: bytes,
    file_name: str,
    *,
    llm_model: ModelType = ModelType.GEMINI_PRO,
) -> Dict[str, Any]:
    """
    Pure function: bytes in → JSON dict out.
    1. Sends the PDF to Docling API (running in Docker)
    2. Feeds extracted text to Gemini for JSON structuring
    """

    start_time = datetime.utcnow().isoformat() + "Z"
    print(f"[INFO] Processing {file_name} ({len(pdf_bytes)} bytes)")

    # === Step 1: Send to Docling API ===
    try:
        print("[INFO] Sending to Docling API...")
        files = {"document": (file_name, pdf_bytes, "application/pdf")}
        res = requests.post(DOCLING_API_URL, files=files, timeout=120)
        print(f"[DEBUG] Docling API response status: {res.status_code}")
        print(f"[DEBUG] Docling API response text (first 200 chars): {res.text[:200]}")
        res.raise_for_status()
        docling_output = res.json()
        print(f"[INFO] Docling extraction OK (keys: {list(docling_output.keys())})")
    except Exception as e:
        print(f"[ERROR] Docling API failed: {e}")
        print(f"[ERROR] Full exception: {repr(e)}")
        return {
            "file_name": file_name,
            "result": {"error": f"Docling API failed: {str(e)}"},
            "meta": {"docling_ok": False, "llm_ok": False, "timestamp": start_time},
        }

    # === Step 2: Extract text content (Docling API version) ===
    raw_md = docling_output.get("markdown") or ""
    # remove image placeholders and collapse excessive newlines
    cleaned_md = "\n".join(
        line for line in raw_md.splitlines()
        if line.strip() and not re.match(r"^picture-\d+\.png$", line.strip(), re.I)
    )
    extracted_text = cleaned_md.strip()

    if not extracted_text and "blocks" in docling_output:
        # fallback for hybrid SDK outputs
        text_blocks = [b.get("text", "") for b in docling_output.get("blocks", []) if b.get("text")]
        extracted_text = "\n".join(text_blocks).strip()

    if not extracted_text:
        print("[WARN] Docling returned no text.")
        return {
            "file_name": file_name,
            "result": {"error": "No text extracted"},
            "meta": {"docling_ok": True, "llm_ok": False, "timestamp": start_time},
        }

    # === Step 3: Send extracted text to Gemini ===
    try:
        print("[INFO] Sending extracted text to LLM...")
        model.set_model(llm_model)
        response = model.chat(extracted_text, json_response=True)
        content = response.choices[0].message.content.strip()

        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            data = {"error": "LLM did not return valid JSON"}
        print("[INFO] LLM JSON parsed successfully.")
    except Exception as e:
        print(f"[ERROR] LLM request failed: {e}")
        data = {"error": f"LLM error: {str(e)}"}

    # === Step 4: Return unified result ===
    result = {
        "file_name": file_name,
        "extracted_at": start_time,
        "result": data,
        "meta": {
            "docling_ok": bool(extracted_text),
            "llm_ok": "error" not in data,
            "llm_model": llm_model.value,
            "source": "docling-api+gemini",
        },
    }
    print(f"[DONE] {file_name} processed successfully.")
    return result