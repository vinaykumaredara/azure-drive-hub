-- SQL script to verify atomic booking database structure

-- 1. Verify cars table has required columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars' 
  AND column_name IN ('booking_status', 'booked_by', 'booked_at', 'price_in_paise', 'currency')
ORDER BY column_name;

-- 2. Verify users table has is_admin column
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'is_admin';

-- 3. Check that the atomic booking function exists
SELECT 
  proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'book_car_atomic';

-- 4. Verify RLS policies for cars table
SELECT 
  polname AS policy_name,
  polcmd AS command_type,
  polqual AS qualification
FROM pg_policy 
WHERE polrelid = 'cars'::regclass;

-- 5. Check indexes on cars table
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'cars' 
  AND indexname LIKE '%booking%';

-- 6. Sample data verification (check a few cars)
SELECT 
  id,
  title,
  booking_status,
  booked_by,
  booked_at,
  price_in_paise,
  currency
FROM cars 
LIMIT 5;

-- 7. Check audit_logs table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 8. Verify is_admin function exists
SELECT 
  proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'is_admin';