import asyncio
import json

from backend.app.schemas.classification_schemas import Classification, ExtractedFile

from app.core.litellm import LLMClient

"""
To test run it -> cd into backend, then run, python3 -m app.utils.pattern_recognition.pattern_rec
"""


async def analyze_category_relationships(
    classifications: list[Classification],
    extracted_files: list[ExtractedFile],
):
    """
    Analyze relationships between categories and generate a markdown report.

    Args:
        categories: List of category names
        extracted_files: List of ExtractedFile objects containing document context
        output_file: Output markdown file path
    """

    file_contexts = []
    for file in extracted_files:
        context = {
            "filename": file.name,
            "type": file.type,
            "extracted_data": file.extracted_data,
            "classification": file.classification.name
            if file.classification
            else "Unclassified",
        }
        file_contexts.append(context)

    # Initialize LLM client
    client = LLMClient()

    categories = [classification.name for classification in classifications]

    # Build prompt
    categories_str = ", ".join(categories)

    # Format file context for the prompt
    file_context_str = "\n".join(
        [
            f"- File: {ctx['filename']} (Type: {ctx['type']}, Classification: {ctx['classification']})\n"
            f"  Data: {json.dumps(ctx['extracted_data'], indent=2)}"
            for ctx in file_contexts
        ]
    )
    prompt = f"""You are a database schema expert. Given these entity names, 
    determine ALL possible relationships/cardinality and permutations between them. We need the
    relationships between ALL categories in order to create our SQL Database.

LIST OF CATEGORIES: {categories_str}
DOCUMENT CONTEXT FROM EXTRACTED FILES: {file_context_str}

Based on the entity types AND the actual data in the extracted files, determine:
1. What relationships exist between entity types
2. The specific field names that should be used as join keys
3. The relationship type (one-to-one, one-to-many, many-to-one, or many-to-many)

Analyze the column names and data patterns carefully to identify which fields should be used for joins.
Look for ID fields, foreign key references, and matching column names across different entity types.

Return ONLY valid JSON with this structure:
{{
  "relationships": [
    {{
      "from_type": "Purchase Order",
      "to_type": "Robot Specification",
      "relationship_type": "many-to-many",
      "join_keys": {{
          "from_field": "po_number",
          "to_field": "specification_id"
      }}
    }},
    {{
      "from_type": "Quotation",
      "to_type": "Purchase Order",
      "relationship_type": "one-to-many",
      "join_keys": {{
          "from_field": "quote_id",
          "to_field": "po_id"
      }}
    }}
  ]
}}

Rules:
- from_type and to_type must exactly match the entity type names from the list
- relationship_type must be EXACTLY one of: "one-to-one", "one-to-many", "many-to-one", or "many-to-many"
- join_keys must specify the actual field/column names from the extracted data
- from_field is the field in the from_type entity
- to_field is the field in the to_type entity that should match/reference from_field
- Only include relationships where you can identify actual matching fields in the data
- If a many-to-many relationship exists, identify the fields that would be used in a junction table
- Base all decisions on the actual column names visible in the extracted_data
- Return ONLY valid JSON, no markdown formatting, no explanations"""

    # Call LLM
    print("Analyzing relationships and join keys...")
    response = await client.chat(prompt, json_response=True)

    # Parse response
    response_text = response.choices[0].message.content.strip()
    analysis = json.loads(response_text)

    print("✓ Analysis complete")
    return analysis


# Example usage
if __name__ == "__main__":
    categories = ["Students", "Classes", "Homework"]
    asyncio.run(analyze_category_relationships(categories))
