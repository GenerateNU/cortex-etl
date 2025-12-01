import json
from collections import defaultdict
from itertools import combinations

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import Classification, ExtractedFile
from app.schemas.relationship_schemas import (
    RelationshipCreate,
    RelationshipType,
)

# Set batch size as a constant at the top
BATCH_SIZE = 3


async def analyze_category_relationships(
    classifications: list[Classification],
    extracted_files: list[ExtractedFile],
) -> list[RelationshipCreate]:
    """
    Hybrid batch approach: Analyze relationships in small batches.

    Balances speed and accuracy by grouping pairs into batches.
    - Faster than analyzing each pair individually
    - More focused than analyzing everything at once

    Args:
        classifications: List of Classification objects
        extracted_files: List of ExtractedFile objects

    Returns:
        list[RelationshipCreate]: List of Relationship objects
    """
    tenant_id = classifications[0].tenant_id

    # Group files by classification
    files_by_classification = defaultdict(list)
    for file in extracted_files:
        if file.classification:
            files_by_classification[file.classification.name].append(file)

    # Sample up to 10 files per classification
    sampled_contexts = {}
    for classification_name, files in files_by_classification.items():
        sampled_contexts[classification_name] = [
            {
                "filename": f.name,
                "data": f.extracted_data,
            }
            for f in files[:10]
        ]

    # Get all classification pairs and split into batches
    classification_pairs = list(combinations(classifications, 2))
    batched_pairs = [
        classification_pairs[i : i + BATCH_SIZE]
        for i in range(0, len(classification_pairs), BATCH_SIZE)
    ]

    client = LLMClient()
    relationships = []

    # Process each batch
    for batch_idx, batch in enumerate(batched_pairs, 1):
        print(f"\nBatch {batch_idx}/{len(batched_pairs)}:")

        # Get all classifications needed for this batch
        batch_classifications = set()
        for from_class, to_class in batch:
            batch_classifications.add(from_class.name)
            batch_classifications.add(to_class.name)

        # Build context for only classifications in this batch
        context_str = ""
        for class_name in batch_classifications:
            if class_name in sampled_contexts:
                context_str += f"CLASSIFICATION: {class_name}\n"
                for file_info in sampled_contexts[class_name]:
                    context_str += f"\n  File: {file_info['filename']}\n"
                    context_str += (
                        f"  Data: {json.dumps(file_info['data'], indent=6)}\n"
                    )
                context_str += f"\n[End of {class_name}]\n\n"

        # List specific pairs to analyze
        pairs_str = "\n".join(
            [
                f"  - {from_class.name} <-> {to_class.name}"
                for from_class, to_class in batch
            ]
        )

        prompt = f"""Analyze relationships between specific classification pairs.

PAIRS TO ANALYZE:
{pairs_str}

DATA:
{context_str}

TASK: For each pair above, determine if there's a database relationship.

Look for:
1. Matching field names (e.g., both have "product_id")
2. Foreign key patterns (e.g., A has "b_id" referencing B)
3. Logical connections in the data structure

Relationship types:
- "one-to-one": Each record in A matches exactly one in B
- "one-to-many": One record in A matches multiple in B
- "many-to-one": Multiple records in A match one in B
- "many-to-many": Records can match multiple on both sides

Return JSON array (only include pairs WITH relationships):
[
  {{"from_type": "ClassA", "to_type": "ClassB", "relationship_type": "many-to-one", "evidence": "explanation"}},
  {{"from_type": "ClassC", "to_type": "ClassD", "relationship_type": "one-to-many", "evidence": "explanation"}}
]

If no relationships found, return: []

Be conservative - only report clear relationships with field-level evidence.
"""

        try:
            response = await client.chat(prompt, json_response=True)
            response_text = response.choices[0].message.content.strip()
            batch_results = json.loads(response_text)

            classification_map = {c.name: c for c in classifications}

            # Process results
            for result in batch_results:
                from_class = classification_map.get(result["from_type"])
                to_class = classification_map.get(result["to_type"])

                if from_class and to_class:
                    print(
                        f"{result['from_type']} → {result['to_type']} ({result['relationship_type']})"
                    )
                    print(f"Evidence: {result.get('evidence', 'N/A')}")

                    relationships.append(
                        RelationshipCreate(
                            tenant_id=tenant_id,
                            from_classification_id=from_class.classification_id,
                            to_classification_id=to_class.classification_id,
                            type=RelationshipType(result["relationship_type"]),
                        )
                    )

            # Show pairs with no relationships
            found_pairs = {(r["from_type"], r["to_type"]) for r in batch_results}
            for from_class, to_class in batch:
                if (from_class.name, to_class.name) not in found_pairs:
                    print(f"{from_class.name} ↔ {to_class.name} (no relationship)")

        except Exception as e:
            print(f"Error in batch {batch_idx}: {str(e)}")
            continue

    return relationships
