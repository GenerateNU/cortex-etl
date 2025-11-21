-- Create classifications table
CREATE TABLE IF NOT EXISTS classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Add classification to file_uploads
ALTER TABLE file_uploads 
ADD COLUMN classification_id UUID REFERENCES classifications(id);

-- Indexes
CREATE INDEX idx_classifications_tenant_id ON classifications(tenant_id);
CREATE INDEX idx_file_uploads_classification_id ON file_uploads(classification_id);

-- Enable RLS
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for classifications
CREATE POLICY classifications_policy ON classifications
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR tenant_id = classifications.tenant_id)
    )
);

-- Constraint to ensure classification matches file tenant
CREATE OR REPLACE FUNCTION check_classification_tenant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.classification_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM classifications c
            WHERE c.id = NEW.classification_id 
            AND c.tenant_id = NEW.tenant_id
        ) THEN
            RAISE EXCEPTION 'Classification must belong to the same tenant as the file';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_file_classification
    BEFORE INSERT OR UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION check_classification_tenant();