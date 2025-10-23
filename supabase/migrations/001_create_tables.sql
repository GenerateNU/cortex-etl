-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create role enum
CREATE TYPE user_role AS ENUM ('tenant', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role user_role NOT NULL DEFAULT 'tenant',
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TYPE file_type AS ENUM ('pdf', 'csv')

CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type file_type NOT NULL
    name TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE extraction_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- Create extracted_files table
CREATE TABLE IF NOT EXISTS extracted_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    status extraction_status NOT NULL,
    extracted_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_tenant_id ON file_uploads(tenant_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_file_uploads_name_pattern ON file_uploads(name) WHERE name LIKE '%.pdf';
CREATE INDEX idx_extracted_files_source_file ON extracted_files(source_file_id);

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;