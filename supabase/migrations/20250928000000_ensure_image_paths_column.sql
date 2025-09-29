-- Ensure image_paths column exists in cars table for storing file paths separately from URLs
-- This migration ensures that both image_urls (for quick frontend load) and image_paths (for deletion) are stored

-- Add image_paths column to cars table if it doesn't exist
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_paths TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);

-- Update existing cars to populate image_paths from image_urls if needed
-- This will extract paths from existing URLs and populate the image_paths column
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
WHERE image_paths IS NULL AND image_urls IS NOT NULL AND array_length(image_urls, 1) > 0;

-- Ensure the cars-photos bucket is public for image access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';