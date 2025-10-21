-- ============================================
-- Test Data Identification Script
-- ============================================
-- Purpose: Safely identify test/placeholder data for review before deletion
-- Usage: Run in Supabase SQL Editor with READ-ONLY mindset
-- Always backup before running deletion scripts!

-- ============================================
-- 1. IDENTIFY TEST CARS
-- ============================================
SELECT 
  id,
  title,
  description,
  created_at,
  status,
  booking_status,
  CASE 
    WHEN lower(title) LIKE '%test%' THEN 'Title contains "test"'
    WHEN lower(description) LIKE '%test%' THEN 'Description contains "test"'
    WHEN lower(title) LIKE '%sample%' THEN 'Title contains "sample"'
    WHEN lower(title) LIKE '%dummy%' THEN 'Title contains "dummy"'
    WHEN lower(title) LIKE '%placeholder%' THEN 'Title contains "placeholder"'
    ELSE 'Other match'
  END as match_reason
FROM cars 
WHERE 
  lower(title) LIKE '%test%' 
  OR lower(description) LIKE '%test%'
  OR lower(title) LIKE '%sample%'
  OR lower(title) LIKE '%dummy%'
  OR lower(title) LIKE '%placeholder%'
  OR lower(description) LIKE '%sample%'
  OR lower(description) LIKE '%dummy%'
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- 2. IDENTIFY TEST USERS
-- ============================================
SELECT 
  id,
  full_name,
  created_at,
  is_admin,
  CASE 
    WHEN full_name LIKE '%test%' THEN 'Name contains "test"'
    WHEN full_name LIKE '%sample%' THEN 'Name contains "sample"'
    WHEN full_name LIKE '%dummy%' THEN 'Name contains "dummy"'
    ELSE 'Other match'
  END as match_reason
FROM users 
WHERE 
  lower(full_name) LIKE '%test%'
  OR lower(full_name) LIKE '%sample%'
  OR lower(full_name) LIKE '%dummy%'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 3. IDENTIFY TEST BOOKINGS
-- ============================================
SELECT 
  b.id,
  b.created_at,
  b.status,
  b.total_amount,
  c.title as car_title,
  u.full_name as user_name
FROM bookings b
LEFT JOIN cars c ON b.car_id = c.id
LEFT JOIN users u ON b.user_id = u.id
WHERE 
  lower(c.title) LIKE '%test%'
  OR lower(u.full_name) LIKE '%test%'
ORDER BY b.created_at DESC
LIMIT 50;

-- ============================================
-- 4. COUNT STORAGE OBJECTS BY PATH PATTERN
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage > cars-photos
-- Look for folders/files with patterns:
-- - test-*
-- - sample-*
-- - dummy-*
-- - placeholder-*
-- - Files with very old timestamps (before go-live date)

-- ============================================
-- 5. SUMMARY STATISTICS
-- ============================================
SELECT 
  'Total Cars' as metric,
  COUNT(*) as count
FROM cars
UNION ALL
SELECT 
  'Potential Test Cars',
  COUNT(*) 
FROM cars 
WHERE 
  lower(title) LIKE '%test%' 
  OR lower(description) LIKE '%test%'
  OR lower(title) LIKE '%sample%'
  OR lower(title) LIKE '%dummy%'
UNION ALL
SELECT 
  'Total Users',
  COUNT(*)
FROM users
UNION ALL
SELECT 
  'Potential Test Users',
  COUNT(*)
FROM users 
WHERE 
  lower(full_name) LIKE '%test%'
  OR lower(full_name) LIKE '%sample%'
UNION ALL
SELECT 
  'Total Bookings',
  COUNT(*)
FROM bookings
UNION ALL
SELECT 
  'Published Cars',
  COUNT(*)
FROM cars
WHERE status = 'published';

-- ============================================
-- SAFETY NOTES
-- ============================================
-- 1. Always review results manually before deletion
-- 2. Create full backup: pg_dump or Supabase Dashboard backup
-- 3. Test deletion on staging environment first
-- 4. Document deleted IDs for potential rollback
-- 5. Never delete production user data without explicit approval
