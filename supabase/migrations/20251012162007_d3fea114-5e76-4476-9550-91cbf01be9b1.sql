-- Fix license upload RLS policies for license-uploads bucket

-- Create license-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('license-uploads', 'license-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own license" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own license" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own license" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own license" ON storage.objects;

-- Allow authenticated users to upload their own licenses
CREATE POLICY "Users can upload their own license"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'license-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own licenses
CREATE POLICY "Users can view their own license"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own licenses
CREATE POLICY "Users can update their own license"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'license-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own licenses
CREATE POLICY "Users can delete their own license"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'license-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure the licenses table has proper RLS policies too
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Drop existing licenses table policies if they exist
DROP POLICY IF EXISTS "Users can view their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can insert their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can update their own licenses" ON licenses;

-- Policy for viewing own licenses
CREATE POLICY "Users can view their own licenses"
ON licenses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for inserting own licenses
CREATE POLICY "Users can insert their own licenses"
ON licenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for updating own licenses (allow users to update, admins to verify)
CREATE POLICY "Users can update their own licenses"
ON licenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);