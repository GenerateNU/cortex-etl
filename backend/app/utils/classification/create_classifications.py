import hdbscan
import numpy as np
from sklearn.preprocessing import normalize

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import ExtractedFile


async def create_classifications(
    extracted_files: list[ExtractedFile],
    initialClassifications: list[str],
) -> list[str]:
    """
    Anlyzes all of the extracted files and the initial classifications
    to iteratively set new classifications returning the final result
    """
    # TODO: Implement the logic that creates/edits classifications from the extracted files.

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
        return initialClassifications

    embeddings_array = np.array(embeddings)

    # Normalize embeddings so that cosine similarity ≈ euclidean distance
    normalized_embeddings = normalize(embeddings_array)  # L2 normalization

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=2,
        min_samples=1,
        metric="euclidean",
        cluster_selection_method="eom",
    )

    cluster_labels = clusterer.fit_predict(normalized_embeddings)
    # HDBSCAN marks outliers with -1
    _outlier_indices = np.where(cluster_labels == -1)[0]

    clusters = {}

    for i, label in enumerate(cluster_labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(valid_files[i])

    outliers = clusters.pop(-1, [])  # Remove -1 cluster if it exists
    print(f"Found {len(clusters)} clusters, {len(outliers)} outliers")

    client = LLMClient()
    classification_names = []

    for cluster_id, files_in_cluster in clusters.items():
        print(f"Analyzing cluster {cluster_id} with {len(files_in_cluster)} files...")

        # Get sample documents from cluster (up to 5 for context)
        sample_texts = []
        for file in files_in_cluster[:5]:
            text = _extract_text_from_file(file)
            sample_texts.append(text[:500])  # Limit text length

        # Use LLM to name the cluster
        prompt = f"""Analyze these similar documents and provide a single, concise classification name.

    Sample documents from this cluster:

    {chr(10).join(f"Document {i + 1}: {text}" for i, text in enumerate(sample_texts))}

    What type of documents are these? Respond with ONLY the category name.
    Do not include any explanation or punctuation."""

        try:
            response = await client.chat(prompt, temperature=0.3, max_tokens=50)
            category_name = response.choices[0].message.content.strip()
            if not category_name:
                category_name = f"Document Type {cluster_id}"
        except Exception as e:
            print(f"  → Error generating name: {e}")
            category_name = f"Document Type {cluster_id}"

        classification_names.append(category_name)
        print(f"  → Named: {category_name}")

    # Handle outliers individually
    for i, file in enumerate(outliers):
        print(f"Analyzing outlier {i} (single file)...")
        text = _extract_text_from_file(file)
        prompt = f"""Analyze this document and provide a concise classification name.

    Document:

    {text}

    Respond with ONLY the category name."""

        try:
            response = await client.chat(prompt, temperature=0.3, max_tokens=50)
            category_name = response.choices[0].message.content.strip()
            if category_name:
                classification_names.append(category_name)
                print(f"  → Outlier named: {category_name}")
            else:
                fallback_name = f"Document Type Outlier {i}"
                classification_names.append(fallback_name)
                print(f"  → Outlier named: {fallback_name}")
        except Exception as e:
            print(f"  → Error naming outlier: {e}")
            fallback_name = f"Document Type Outlier {i}"
            print(f"  → Outlier named: {fallback_name}")

    all_classifications = classification_names + initialClassifications
    final_classifications = list(set(all_classifications))

    print(f"Final classifications: {final_classifications}")
    return final_classifications


def _extract_text_from_file(file: ExtractedFile) -> str:
    """Convert extracted file to text representation for analysis."""
    parts = []

    # Add filename
    if file.name:
        parts.append(f"Filename: {file.name}")

    # Add extracted content
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
