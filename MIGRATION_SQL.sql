-- Migration to add image_paths and image_urls columns to cars table if they don't exist
-- This ensures proper image handling and storage

-- Add image_paths and image_urls columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];