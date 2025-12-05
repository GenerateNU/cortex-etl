import hdbscan
import numpy as np
from sklearn.preprocessing import normalize

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import ExtractedFile


async def create_classifications(
    extracted_files: list[ExtractedFile],
    initial_classifications: list[str],
) -> list[str]:
    """
    Analyzes extracted files using clustering, then uses LLM to name clusters.
    LLM is biased toward reusing existing classification names when applicable.
    Returns the final set of classifications based on actual file content.
    """
    embeddings = []
    valid_files = []

    for file in extracted_files:
        if file.embedding is not None and len(file.embedding) > 0:
            embeddings.append(file.embedding)
            valid_files.append(file)

    if len(embeddings) < 3:
        print(
            f"Not enough files for clustering ({len(embeddings)}), returning initial classifications"
        )
        return initial_classifications

    embeddings_array = np.array(embeddings)
    normalized_embeddings = normalize(embeddings_array)

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=2,
        min_samples=1,
        metric="euclidean",
        cluster_selection_method="eom",
    )

    cluster_labels = clusterer.fit_predict(normalized_embeddings)

    clusters = {}
    for i, label in enumerate(cluster_labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(valid_files[i])

    outliers = clusters.pop(-1, [])
    print(f"Found {len(clusters)} clusters, {len(outliers)} outliers")

    client = LLMClient()
    classification_names = []

    # Build existing classifications context
    existing_context = ""
    if initial_classifications:
        existing_context = f"""Existing classifications (reuse EXACTLY if applicable):
{chr(10).join(f"- {c}" for c in initial_classifications)}

"""

    for cluster_id, files_in_cluster in clusters.items():
        print(f"Analyzing cluster {cluster_id} with {len(files_in_cluster)} files...")

        sample_texts = []
        for file in files_in_cluster[:5]:
            text = _extract_text_from_file(file)
            sample_texts.append(text)

        prompt = f"""{existing_context}Analyze these similar documents and classify them.

Sample documents from this cluster:
{chr(10).join(f"Document {i + 1}: {text}" for i, text in enumerate(sample_texts))}

If documents match an existing classification, respond with that EXACT name (case-sensitive).
Otherwise, create a new concise classification name.
Respond with ONLY the classification name, no explanation or punctuation."""

        response = await client.chat(prompt)
        category_name = response.choices[0].message.content
        if not category_name:
            category_name = f"Document Type {cluster_id}"

        classification_names.append(category_name.strip())
        print(f"  → Named: {category_name.strip()}")

    # Dedupe in case multiple clusters matched the same classification
    final_classifications = list(set(classification_names))
    print(f"Final classifications: {final_classifications}")
    return final_classifications


def _extract_text_from_file(file: ExtractedFile) -> str:
    """Convert extracted file to text representation for analysis."""
    parts = []

    if file.name:
        parts.append(f"Filename: {file.name}")

    if isinstance(file.extracted_data, dict):
        for key, value in file.extracted_data.items():
            if isinstance(value, dict | list):
                continue
            parts.append(f"{key}: {value}")
    elif isinstance(file.extracted_data, list):
        parts.append(
            f"Items: {', '.join(str(item) for item in file.extracted_data[:5])}"
        )
    else:
        parts.append(str(file.extracted_data))

    return " ".join(parts)
