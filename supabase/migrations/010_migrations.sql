-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sql TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, sequence)
);

-- Indexes
CREATE INDEX idx_migrations_tenant_id ON migrations(tenant_id);
CREATE INDEX idx_migrations_sequence ON migrations(sequence);

-- Enable RLS
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for migrations
CREATE POLICY migrations_policy ON migrations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR tenant_id = migrations.tenant_id)
    )
);

-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
