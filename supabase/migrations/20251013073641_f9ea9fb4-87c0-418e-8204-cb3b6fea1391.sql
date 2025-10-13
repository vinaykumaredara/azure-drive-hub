-- Fix license upload RLS policies for storage bucket
-- This allows authenticated users to upload and view their own license files

-- Policy for authenticated users to upload their own licenses
CREATE POLICY "Users can upload their own licenses"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'license-uploads' 
  AND (storage.foldername(name))[1] = 'licenses'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for authenticated users to view their own licenses
CREATE POLICY "Users can view their own licenses"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-uploads' 
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Policy for authenticated users to update their own licenses
CREATE POLICY "Users can update their own licenses"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'license-uploads' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for authenticated users to delete their own licenses
CREATE POLICY "Users can delete their own licenses"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'license-uploads' 
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Add audit log
INSERT INTO audit_logs (action, description, metadata)
VALUES (
  'security_fix',
  'Fixed license upload RLS policies for storage bucket',
  jsonb_build_object(
    'bucket', 'license-uploads',
    'fixed_at', now(),
    'policies_added', 4
  )
);