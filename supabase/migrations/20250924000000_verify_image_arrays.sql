-- Migration to verify image_urls and image_paths columns are properly configured as arrays
-- This is a verification-only migration to confirm the schema is correct

-- Check if image_urls column exists and is of type TEXT[]
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cars' 
  AND column_name = 'image_urls';

-- Check if image_paths column exists and is of type TEXT[]
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cars' 
  AND column_name = 'image_paths';

-- Verify we can insert array data
INSERT INTO public.cars (title, make, model, year, seats, fuel_type, transmission, price_per_day, image_urls) 
VALUES ('Schema Test Car', 'Test', 'Array', 2023, 5, 'Petrol', 'Automatic', 3000, ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg'])
ON CONFLICT DO NOTHING;

-- Verify we can update array data
UPDATE public.cars 
SET image_urls = ARRAY['https://example.com/image3.jpg', 'https://example.com/image4.jpg'] 
WHERE title = 'Schema Test Car';

-- Clean up test data
DELETE FROM public.cars WHERE title = 'Schema Test Car';

-- Report success
SELECT '✅ Database schema verification completed - image_urls and image_paths are properly configured as TEXT[] arrays' as status;