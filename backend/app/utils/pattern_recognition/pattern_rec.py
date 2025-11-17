import json
from collections import defaultdict

from app.core.litellm import LLMClient
from app.schemas.classification_schemas import Classification, ExtractedFile
from app.schemas.relationship_schemas import (
    RelationshipCreate,
    RelationshipType,
)

"""
To test run it -> cd into backend, then run, python3 -m app.utils.pattern_recognition.pattern_rec
"""

async def analyze_category_relationships(
    classifications: list[Classification],
    extracted_files: list[ExtractedFile],
) -> list[RelationshipCreate]:
    """
    Analyze relationships between categories and generate a markdown report.

    Args:
        categories: List of category names
        extracted_files: List of ExtractedFile objects containing document context
        output_file: Output markdown file path

    Returns:
        list[Relationship]: List of Relationship objects
    """

    tenant_id = classifications[0].tenant_id

    # Group files by classification
    files_by_classification = defaultdict(list)
    for file in extracted_files:
        files_by_classification[file.classification.name].append(file)

    sampled_contexts = {}
    for classification_name, files in files_by_classification.items():
        sampled_contexts[classification_name] = [
            {
                "filename": f.name,
                "data": f.extracted_data,
            }
            for f in files[:10]
        ]

    # Build prompt
    categories = [c.name for c in classifications]
    categories_str = ", ".join(categories)

    # Converts to the dic to a string for the LLM prompt
    context_str = ""
    for name, files_info in sampled_contexts.items():
        context_str += f"\n{name}:\n"
        for file_info in files_info:
            context_str += f"  {file_info['filename']}:\n"
            context_str += f"    {json.dumps(file_info['data'], indent=4)}\n"

    prompt = f"""Analyze relationships between these entities.

    ENTITIES: {categories_str}

    DATA:
    {context_str}

    Find relationships by looking for foreign key patterns.

    Return JSON:
    [
    {{"from_type": "Students", "to_type": "Classes", "relationship_type": "many-to-one"}}
    ]

    Rules:
    - from_type/to_type from: {categories_str}
    - relationship_type: "one-to-one", "one-to-many", "many-to-one", or "many-to-many" ONLY
    """
    # Call LLM
    client = LLMClient()
    response = await client.chat(prompt, json_response=True)

    # Parse response
    response_text = response.choices[0].message.content.strip()
    data = json.loads(response_text)

    # Map names to classifications
    classification_map = {c.name: c for c in classifications}

    # Build relationships
    relationships = []
    for item in data:
        from_class = classification_map[item["from_type"]]
        to_class = classification_map[item["to_type"]]

        relationships.append(
            RelationshipCreate(
                tenant_id=tenant_id,
                from_classification=from_class,
                to_classification=to_class,
                type=RelationshipType(item["relationship_type"]),
            )
        )

    return relationships


if __name__ == "__main__":
    import asyncio
    from uuid import uuid4

    async def main():
        # Setup test data
        tenant_id = uuid4()

        # Create classifications
        student_classification = Classification(
            classification_id=uuid4(), tenant_id=tenant_id, name="Students"
        )

        class_classification = Classification(
            classification_id=uuid4(), tenant_id=tenant_id, name="Classes"
        )

        homework_classification = Classification(
            classification_id=uuid4(), tenant_id=tenant_id, name="Homework"
        )

        classifications = [
            student_classification,
            class_classification,
            homework_classification,
        ]

        # Create extracted files
        extracted_files = [
            ExtractedFile(
                file_upload_id=uuid4(),
                type="csv",
                name="students.csv",
                tenant_id=tenant_id,
                extracted_file_id=uuid4(),
                extracted_data={
                    "headers": ["student_id", "name", "email", "class_id"],
                    "sample_rows": [
                        {"student_id": 1, "name": "John", "class_id": 101},
                        {"student_id": 2, "name": "Jane", "class_id": 101},
                    ],
                },
                embedding=[0.1],
                classification=student_classification,
            ),
            ExtractedFile(
                file_upload_id=uuid4(),
                type="csv",
                name="classes.csv",
                tenant_id=tenant_id,
                extracted_file_id=uuid4(),
                extracted_data={
                    "headers": ["class_id", "class_name", "teacher"],
                    "sample_rows": [
                        {
                            "class_id": 101,
                            "class_name": "Math 101",
                            "teacher": "Prof. Smith",
                        }
                    ],
                },
                embedding=[0.2],
                classification=class_classification,
            ),
            ExtractedFile(
                file_upload_id=uuid4(),
                type="csv",
                name="homework.csv",
                tenant_id=tenant_id,
                extracted_file_id=uuid4(),
                extracted_data={
                    "headers": ["homework_id", "title", "class_id", "student_id"],
                    "sample_rows": [
                        {
                            "homework_id": 1,
                            "title": "Assignment 1",
                            "class_id": 101,
                            "student_id": 1,
                        }
                    ],
                },
                embedding=[0.3],
                classification=homework_classification,
            ),
        ]

        # Test the function
        print("Testing relationship analysis...")
        relationships = await analyze_category_relationships(
            classifications, extracted_files
        )

        print(f"\nFound {len(relationships)} relationships:")
        for rel in relationships:
            print(
                f"  {rel.from_classification.name} → {rel.to_classification.name} ({rel.type.value})"
            )

    # Run the async function
    asyncio.run(main())
