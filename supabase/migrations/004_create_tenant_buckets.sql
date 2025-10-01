-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Tenant users can upload to their own folder
CREATE POLICY "Tenants can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Tenant users can read from their own folder
CREATE POLICY "Tenants can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Tenant users can delete their own files
CREATE POLICY "Tenants can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Admin users can access all files
CREATE POLICY "Admins can access all files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);