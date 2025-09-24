-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

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