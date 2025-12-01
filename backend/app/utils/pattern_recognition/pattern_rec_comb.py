import json
from collections import defaultdict
from itertools import combinations

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import Classification, ExtractedFile
from app.schemas.relationship_schemas import (
    RelationshipCreate,
    RelationshipType,
)

"""
To test run it -> cd into backend, then run, python3 -m app.utils.pattern_recognition.pattern_rec
"""


async def analyze_category_relationships_pairwise(
    classifications: list[Classification],
    extracted_files: list[ExtractedFile],
) -> list[RelationshipCreate]:
    """
    Analyze relationships between categories by examining each pair individually.
    This reduces hallucination by focusing the LLM on one relationship at a time.

    Args:
        classifications: List of Classification objects
        extracted_files: List of ExtractedFile objects containing document context

    Returns:
        list[RelationshipCreate]: List of Relationship objects
    """
    tenant_id = classifications[0].tenant_id

    # Group files by classification
    files_by_classification = defaultdict(list)
    for file in extracted_files:
        if file.classification:
            files_by_classification[file.classification.name].append(file)

    # Create sampled contexts for each classification
    sampled_contexts = {}
    for classification_name, files in files_by_classification.items():
        sampled_contexts[classification_name] = [
            {
                "filename": f.name,
                "data": f.extracted_data,
            }
            for f in files[:10]
        ]

    # Initialize LLM client once
    client = LLMClient()

    relationships = []

    # Analyze each pair of classifications separately
    classification_pairs = list(combinations(classifications, 2))

    for from_class, to_class in classification_pairs:
        # Build context for just this pair
        pair_context_str = ""

        # Add from_classification data
        pair_context_str += f"CLASSIFICATION A: {from_class.name}\n"
        for file_info in sampled_contexts[from_class.name]:
            pair_context_str += f"\n  File: {file_info['filename']}\n"
            pair_context_str += f"  Data: {json.dumps(file_info['data'], indent=6)}\n"
        pair_context_str += f"\n[End of {from_class.name}]\n\n"

        # Add to_classification data
        pair_context_str += f"CLASSIFICATION B: {to_class.name}\n"
        for file_info in sampled_contexts[to_class.name]:
            pair_context_str += f"\n  File: {file_info['filename']}\n"
            pair_context_str += f"  Data: {json.dumps(file_info['data'], indent=6)}\n"
        pair_context_str += f"\n[End of {to_class.name}]\n"

        # Create focused prompt for this pair
        prompt = f"""You are analyzing if there is a relationship between TWO specific classifications.

CLASSIFICATION A: {from_class.name}
CLASSIFICATION B: {to_class.name}

DATA FOR THESE TWO CLASSIFICATIONS:
{pair_context_str}

TASK: Determine if there is a database relationship between these two classifications.

Look for:
1. Matching field names (e.g., both have "product_id")
2. Foreign key patterns (e.g., A has "classification_b_id")
3. Logical connections based on the data structure

IMPORTANT: Only return a relationship if you see CLEAR EVIDENCE in the field names or data structure.
If there's no clear connection, respond with "no_relationship".

If there IS a relationship, determine the type:
- "one-to-one": Each record in A matches exactly one in B
- "one-to-many": One record in A matches multiple in B (from A's perspective)
- "many-to-one": Multiple records in A match one in B (from A's perspective)
- "many-to-many": Records can match multiple on both sides

Return JSON in ONE of these formats:

If relationship exists:
{{"has_relationship": true, "from_type": "{from_class.name}", "to_type": "{to_class.name}", "relationship_type": "many-to-one", "evidence": "brief explanation"}}

If NO relationship exists:
{{"has_relationship": false}}

Be conservative - only report relationships with clear evidence.
"""

        try:
            # Call LLM for this specific pair
            response = await client.chat(prompt, json_response=True)
            response_text = response.choices[0].message.content.strip()
            result = json.loads(response_text)

            # Only add if relationship was found
            if result.get("has_relationship", False):
                print(
                    f"Found: {from_class.name} -> {to_class.name} ({result.get('relationship_type')})"
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
            else:
                print(f"No relationship: {from_class.name} <-> {to_class.name}")

        except Exception as e:
            print(f"Error analyzing {from_class.name} <-> {to_class.name}: {str(e)}")
            continue

    return relationships
