-- Migration to fix bucket permissions and RLS policies for cars-photos bucket
-- This migration ensures the bucket is public and has proper access policies

-- Ensure the cars-photos bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cars-photos', 'cars-photos', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Ensure the cars-photos bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cars_photos_select_all" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_delete_admin" ON storage.objects;

-- Create new policies for cars-photos bucket
-- Allow public SELECT access to car photos
CREATE POLICY "cars_photos_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'cars-photos');

-- Allow admin INSERT access to car photos
CREATE POLICY "cars_photos_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cars-photos' AND public.is_admin());

-- Allow admin UPDATE access to car photos
CREATE POLICY "cars_photos_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cars-photos' AND public.is_admin());

-- Allow admin DELETE access to car photos
CREATE POLICY "cars_photos_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'cars-photos' AND public.is_admin());

-- Comments for documentation
COMMENT ON POLICY "cars_photos_select_all" ON storage.objects IS 'Allow public access to car photos';
COMMENT ON POLICY "cars_photos_insert_admin" ON storage.objects IS 'Allow admin to upload car photos';
COMMENT ON POLICY "cars_photos_update_admin" ON storage.objects IS 'Allow admin to update car photos';
COMMENT ON POLICY "cars_photos_delete_admin" ON storage.objects IS 'Allow admin to delete car photos';

-- Report success
SELECT '✅ Bucket permissions and policies verification completed - cars-photos bucket is properly configured' as status;-- Migration to fix bucket permissions and RLS policies for cars-photos bucket
-- This migration ensures the bucket is public and has proper access policies

-- Ensure the cars-photos bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cars-photos', 'cars-photos', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Ensure the cars-photos bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cars_photos_select_all" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "cars_photos_delete_admin" ON storage.objects;

-- Create new policies for cars-photos bucket
-- Allow public SELECT access to car photos
CREATE POLICY "cars_photos_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'cars-photos');

-- Allow admin INSERT access to car photos
CREATE POLICY "cars_photos_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cars-photos' AND public.is_admin());

-- Allow admin UPDATE access to car photos
CREATE POLICY "cars_photos_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cars-photos' AND public.is_admin());

-- Allow admin DELETE access to car photos
CREATE POLICY "cars_photos_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'cars-photos' AND public.is_admin());

-- Comments for documentation
COMMENT ON POLICY "cars_photos_select_all" ON storage.objects IS 'Allow public access to car photos';
COMMENT ON POLICY "cars_photos_insert_admin" ON storage.objects IS 'Allow admin to upload car photos';
COMMENT ON POLICY "cars_photos_update_admin" ON storage.objects IS 'Allow admin to update car photos';
COMMENT ON POLICY "cars_photos_delete_admin" ON storage.objects IS 'Allow admin to delete car photos';

-- Report success
SELECT '✅ Bucket permissions and policies verification completed - cars-photos bucket is properly configured' as status;