-- SQL script to verify database schema for atomic booking implementation

-- 1. Check cars table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cars' 
  AND column_name IN ('booking_status', 'booked_by', 'booked_at', 'price_in_paise', 'currency')
ORDER BY ordinal_position;

-- 2. Check users table for is_admin column
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'is_admin';

-- 3. Check audit_logs table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 4. Check indexes on cars table
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'cars' 
  AND indexname LIKE '%cars%';

-- 5. Check if book_car_atomic function exists
SELECT 
  proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'book_car_atomic';

-- 6. Check RLS policies for cars table
SELECT 
  polname AS policy_name,
  polcmd AS command_type,
  polqual AS qualification
FROM pg_policy 
WHERE polrelid = 'cars'::regclass;

-- 7. Sample data check
SELECT 
  id,
  title,
  booking_status,
  booked_by,
  booked_at,
  price_in_paise,
  currency
FROM cars 
LIMIT 3;

-- 8. Check audit_logs sample data
SELECT 
  action,
  description,
  user_id,
  metadata,
  timestamp
FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 5;