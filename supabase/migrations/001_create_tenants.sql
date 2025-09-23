-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy and recreate (idempotent)
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'tenant_id' = tenants.id::text
    )
    OR EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Enable http extension for webhooks
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;