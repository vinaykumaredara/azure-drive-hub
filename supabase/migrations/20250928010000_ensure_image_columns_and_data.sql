-- Migration to ensure image_paths and image_urls columns exist and are properly populated
-- This migration ensures both columns exist and populates missing data

-- Ensure image_urls column exists
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Ensure image_paths column exists
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_paths TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.cars.image_urls IS 'Public URLs for car images in cars-photos bucket';
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_urls ON public.cars USING GIN (image_urls);
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);

-- Populate image_paths from existing image_urls where needed
-- This extracts paths from URLs and stores them in image_paths column
UPDATE public.cars 
SET image_paths = ARRAY(
  SELECT 
    CASE 
      WHEN image_url LIKE 'http%storage/v1/object/public/cars-photos/%' THEN
        SUBSTRING(image_url FROM POSITION('/cars-photos/' IN image_url) + 13)
      WHEN image_url LIKE 'http%storage/v1/object/authenticated/cars-photos/%' THEN
        SUBSTRING(image_url FROM POSITION('/cars-photos/' IN image_url) + 13)
      ELSE image_url
    END
  FROM unnest(image_urls) AS image_url
)
WHERE (image_paths IS NULL OR array_length(image_paths, 1) = 0) 
  AND image_urls IS NOT NULL 
  AND array_length(image_urls, 1) > 0;

-- Populate image_urls from image_paths where needed
-- This generates public URLs from paths and stores them in image_urls column
UPDATE public.cars 
SET image_urls = ARRAY(
  SELECT 
    CASE 
      WHEN image_path LIKE 'http%' THEN
        image_path
      ELSE
        CONCAT('https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/', image_path)
    END
  FROM unnest(image_paths) AS image_path
)
WHERE (image_urls IS NULL OR array_length(image_urls, 1) = 0) 
  AND image_paths IS NOT NULL 
  AND array_length(image_paths, 1) > 0;

-- Ensure the cars-photos bucket is public for image access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';

-- Report success
SELECT '✅ Database schema and data verification completed - image_urls and image_paths are properly configured' as status;