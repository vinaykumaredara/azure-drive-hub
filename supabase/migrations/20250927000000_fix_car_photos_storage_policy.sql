-- Fix storage policy for cars-photos bucket to allow public access
-- This migration ensures that car images can be accessed by anyone (public)

-- Drop existing policy
DROP POLICY IF EXISTS "cars_photos_select_all" ON storage.objects;

-- Create new policy that allows public SELECT access to cars-photos bucket
CREATE POLICY "cars_photos_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'cars-photos');

-- Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';

-- Comments for documentation
COMMENT ON POLICY "cars_photos_select_all" ON storage.objects IS 'Allow public access to car photos';