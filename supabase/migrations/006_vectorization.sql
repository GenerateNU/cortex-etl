CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to extracted_files
ALTER TABLE extracted_files 
ADD COLUMN embedding vector(768);

-- Index for similarity search
CREATE INDEX ON extracted_files USING ivfflat (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    source_file_id uuid,
    extracted_data jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ef.id,
        ef.source_file_id,
        ef.extracted_data,
        1 - (ef.embedding <=> query_embedding) as similarity
    FROM extracted_files ef
    JOIN file_uploads fu ON fu.id = ef.source_file_id
    WHERE 
        ef.embedding IS NOT NULL
        AND (filter_tenant_id IS NULL OR fu.tenant_id = filter_tenant_id)
        AND 1 - (ef.embedding <=> query_embedding) > match_threshold
    ORDER BY ef.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;