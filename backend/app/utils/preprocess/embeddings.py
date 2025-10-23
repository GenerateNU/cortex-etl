import json

from app.core.litellm import EmbeddingModelType, LLMClient

# Initialize client with Gemini embeddings
client = LLMClient()
client.set_embedding_model(EmbeddingModelType.MODERNBERT_EMBED_BASE)


async def generate_embedding(extracted_json: dict) -> list[float]:
    """
    Generate embedding for entire document.
    Converts JSON to text representation for embedding.

    Returns 768-dimensional vector (Gemini default)
    """
    # Convert JSON to structured text
    text = _json_to_text(extracted_json)

    # Generate embedding using Gemini
    embedding = await client.embed(text)

    return embedding


def _json_to_text(data: dict) -> str:
    """
    Convert extracted JSON to readable text format.
    Better than json.dumps() for semantic meaning.
    """
    parts = []

    # File metadata
    if "file_name" in data:
        parts.append(f"Document: {data['file_name']}")

    # Main content
    if "result" in data:
        result = data["result"]

        # Handle dict result
        if isinstance(result, dict):
            for key, value in result.items():
                if isinstance(value, dict | list):
                    parts.append(f"{key}: {json.dumps(value)}")
                else:
                    parts.append(f"{key}: {value}")

        # Handle list result
        elif isinstance(result, list):
            parts.append(f"Items: {json.dumps(result)}")

        # Fallback for other types
        else:
            parts.append(f"Content: {str(result)}")

    return "\n".join(parts)
