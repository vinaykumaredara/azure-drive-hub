-- Add image_paths column to cars table for storing file paths separately from URLs
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_paths TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);