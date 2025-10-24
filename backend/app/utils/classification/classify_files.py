from app.schemas.classification_schemas import Classification, ExtractedFile


async def classify_files(
    extracted_files: list[ExtractedFile],
    classifications: list[Classification],
) -> list[ExtractedFile]:
    """
    Anlyzes all of the extracted files and the classifications
    to classify each file, returing the classified extracted files
    """
    # TODO: Implement the logic that analyzes each file and assigns classifications, returning the updated list
    return extracted_files
