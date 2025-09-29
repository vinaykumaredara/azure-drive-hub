-- Add image_paths and image_urls columns to cars table
-- This fixes the "column cars.image_path does not exist" error in the user dashboard
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];

-- Add comments for documentation
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';
COMMENT ON COLUMN public.cars.image_urls IS 'Public URLs for car images in cars-photos bucket';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);
CREATE INDEX IF NOT EXISTS idx_cars_image_urls ON public.cars USING GIN (image_urls);