-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_files ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON tenants
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR tenant_id = tenants.id)
    )
);

-- Profiles policy
CREATE POLICY profiles_policy ON public.profiles
FOR ALL USING (auth.uid() = id);

-- File uploads policy - users can only see files for their tenant
CREATE POLICY file_uploads_policy ON file_uploads
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR tenant_id = file_uploads.tenant_id)
    )
);

-- Extracted files policty - users can only see extractions for their tenant's files
CREATE POLICY extracted_files_policy ON extracted_files
FOR ALL USING (
    EXISTS (
        SELECT 1 
        FROM file_uploads fu
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE fu.id = extracted_files.source_file_id
        AND (p.role = 'admin' OR p.tenant_id = fu.tenant_id)
    )
);