import json

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


async def extract_pdf_data(
    pdf_bytes: bytes,
    file_name: str,
    llm_model: ModelType = ModelType.GEMINI_PRO,
) -> dict:
    model.set_model(llm_model)
    response = await model.chat(
        "Extract tables", pdf_bytes=pdf_bytes, json_response=True
    )

    text = response.choices[0].message.content.strip()

    print("JSON response received", flush=True)
    try:
        data = json.loads(text)
    except Exception:
        data = {"error": "LLM did not return JSON"}

    print("JSON response parsed", flush=True)

    return {
        "file_name": file_name,
        "result": data,
        "meta": {"llm_model": llm_model.value, "source": "gemini-pdf-only"},
    }
