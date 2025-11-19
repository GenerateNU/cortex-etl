-- Create relationship type enum
CREATE TYPE relationship_type AS ENUM ('one-to-one', 'one-to-many', 'many-to-many');

-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_classification_id UUID NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,
    to_classification_id UUID NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,
    type relationship_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, from_classification_id, to_classification_id)
);

-- Indexes
CREATE INDEX idx_relationships_tenant_id ON relationships(tenant_id);
CREATE INDEX idx_relationships_from_classification_id ON relationships(from_classification_id);
CREATE INDEX idx_relationships_to_classification_id ON relationships(to_classification_id);

-- Enable RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for relationships
CREATE POLICY relationships_policy ON relationships
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR tenant_id = relationships.tenant_id)
    )
);
