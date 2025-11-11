import numpy as np

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import Classification, ExtractedFile


async def classify_files(
    extracted_files: list[ExtractedFile],
    classifications: list[Classification],
) -> list[ExtractedFile]:
    """
    Classifies extracted files by comparing their embeddings to
    classification name embeddings.

    Each file is assigned the classification with the highest cosine similarity.
    """

    if not extracted_files or not classifications:
        return extracted_files

    client = LLMClient()
    classification_embeddings = {}

    # Generate embeddings for each classification name
    print(f"Generating embeddings for {len(classifications)} classifications...")
    for classification in classifications:
        try:
            emb = await client.embed(classification.name)
            classification_embeddings[classification.classification_id] = emb
        except Exception as e:
            print(f"Error generating embedding for '{classification.name}': {e}")
            continue

    if not classification_embeddings:
        print("No classification embeddings generated, returning files unchanged")
        return extracted_files

    # Assign best matching classification to each file
    print(f"Classifying {len(extracted_files)} files using embedding similarity...")
    for file in extracted_files:
        if file.embedding is None or len(file.embedding) == 0:
            print(f"File {file.name} has no embedding, skipping")
            continue

        best_similarity = -1
        best_classification = None

        for class_id, class_emb in classification_embeddings.items():
            sim = _cosine_similarity(file.embedding, class_emb)
            if sim > best_similarity:
                best_similarity = sim
                best_classification = next(
                    (c for c in classifications if c.classification_id == class_id),
                    None,
                )

        if best_classification:
            file.classification = best_classification
            print(
                f"  {file.name} → {best_classification.name} (similarity: {best_similarity:.3f})"
            )

    return extracted_files


def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Returns a value between -1 and 1:
    - 1 means vectors point in same direction (very similar)
    - 0 means vectors are orthogonal (unrelated)
    - -1 means vectors point in opposite directions (very different)
    """
    v1 = np.array(vec1)
    v2 = np.array(vec2)

    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(dot_product / (norm1 * norm2))
