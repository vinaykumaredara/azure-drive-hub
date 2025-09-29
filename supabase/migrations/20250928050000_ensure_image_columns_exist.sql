-- Migration to ensure cars table has image_paths and image_urls columns
-- This migration ensures both columns exist and are properly configured

-- Ensure image_paths column exists
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_paths TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ensure image_urls column exists
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';
COMMENT ON COLUMN public.cars.image_urls IS 'Public URLs for car images in cars-photos bucket';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);
CREATE INDEX IF NOT EXISTS idx_cars_image_urls ON public.cars USING GIN (image_urls);

-- Ensure the cars-photos bucket is public for image access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';

-- Report success
SELECT '✅ Database schema verification completed - image_paths and image_urls columns are properly configured' as status;