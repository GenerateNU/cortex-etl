# --- LLM-only extractor (no Docling/pdfplumber) ---
import io, os, re, json, time, tempfile
try:
    import google.generativeai as genai
except Exception:
    genai = None

def _llm_only_prompt() -> str:
    return (
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
    model: str = "gemini-2.5-pro",   # or "gemini-2.5-pro" if enabled
) -> dict:
    if genai is None:
        raise RuntimeError("google-generativeai is not installed. `pip install google-generativeai`")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)

    # 1) Write bytes to a temp file and upload via path=...
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    uploaded = None
    try:
        uploaded = genai.upload_file(
            path=tmp_path,                       # <-- use path, not file
            mime_type="application/pdf",
            display_name=file_name,
        )

        # 2) Wait until Gemini finishes processing
        #    (some SDKs expose state.name, others just state)
        def _state_name(f):
            try:
                return getattr(getattr(f, "state", None), "name", None) or getattr(f, "state", None)
            except Exception:
                return None

        while _state_name(uploaded) == "PROCESSING":
            time.sleep(0.5)
            uploaded = genai.get_file(uploaded.name)

        # 3) Ask for JSON only
        model_obj = genai.GenerativeModel(model)
        resp = model_obj.generate_content(
            [
                {"text": _llm_only_prompt()},
                uploaded,
            ],
            generation_config={"response_mime_type": "application/json"},
        )

        text = (getattr(resp, "text", "") or "").strip()
        try:
            data = json.loads(text)
        except Exception:
            # Fallback if the model ignored the JSON MIME and returned prose
            i, j = text.find("{"), text.rfind("}")
            data = json.loads(text[i:j+1]) if i != -1 and j > i else {"error": "LLM did not return JSON"}

        return {
            "file_name": file_name,
            "result": data,
            "meta": {"llm_model": model, "source": "gemini-pdf-only"},
        }

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        # Optional: delete the uploaded file from Gemini storage
        try:
            if uploaded is not None:
                genai.delete_file(uploaded.name)
        except Exception:
            pass