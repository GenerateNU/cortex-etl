-- Migration: Automate file_uploads creation and webhook triggering

-- Config table for webhook settings (persists across sessions)
CREATE TABLE IF NOT EXISTS webhook_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default placeholders
INSERT INTO webhook_config (key, value)
VALUES 
  ('extract_webhook_url', ''),
  ('extract_webhook_secret', '')
ON CONFLICT (key) DO NOTHING;

-- Function to handle storage uploads
CREATE OR REPLACE FUNCTION handle_storage_upload()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_val UUID;
  webhook_url TEXT;
  webhook_secret TEXT;
  filename TEXT;
  file_upload_id UUID;
BEGIN
  -- Only process documents bucket
  IF NEW.bucket_id != 'documents' THEN
    RETURN NEW;
  END IF;

  -- Extract tenant_id from path (format: "tenant_id/filename.pdf")
  -- Example: "550e8400-e29b-41d4-a716-446655440000/invoice.pdf"
  BEGIN
    tenant_id_val := (regexp_matches(NEW.name, '^([a-f0-9-]{36})/'))[1]::UUID;
    filename := regexp_replace(NEW.name, '^[a-f0-9-]{36}/', '');
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Invalid format, skip
  END;

  -- Create file_uploads entry and capture the ID
  INSERT INTO file_uploads (name, bucket_id, tenant_id)
  VALUES (filename, NEW.bucket_id, tenant_id_val)
  ON CONFLICT DO NOTHING
  RETURNING id INTO file_upload_id;

  -- Only trigger webhook for PDFs
  IF NOT filename LIKE '%.pdf' THEN
    RETURN NEW;
  END IF;

  -- Get webhook config from table (persists across sessions)
  SELECT value INTO webhook_url 
  FROM webhook_config WHERE key = 'extract_webhook_url';
  
  SELECT value INTO webhook_secret 
  FROM webhook_config WHERE key = 'extract_webhook_secret';

  -- Skip if webhook not configured
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Fire webhook asynchronously
  PERFORM net.http_post(
    url := webhook_url || '/' || file_upload_id,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', COALESCE(webhook_secret, '')
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires AFTER successful insert (filters out RLS test inserts)
DROP TRIGGER IF EXISTS trigger_storage_upload ON storage.objects;
CREATE TRIGGER trigger_storage_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'documents')
  EXECUTE FUNCTION handle_storage_upload();

-- Helper function for backend to update config
CREATE OR REPLACE FUNCTION update_webhook_config(url TEXT, secret TEXT)
RETURNS void AS $$
BEGIN
  UPDATE webhook_config 
  SET value = url, updated_at = NOW() 
  WHERE key = 'extract_webhook_url';
  
  UPDATE webhook_config 
  SET value = secret, updated_at = NOW() 
  WHERE key = 'extract_webhook_secret';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;