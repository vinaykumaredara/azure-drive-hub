-- ============================================
-- Test Data Cleanup Script
-- ============================================
-- ⚠️ CRITICAL: Only run AFTER:
-- 1. Running backup-before-cleanup.sql
-- 2. Reviewing identify-test-data.sql results
-- 3. Getting explicit approval with [APPROVE-DELETE-TESTDATA] flag
-- ============================================

-- ============================================
-- STEP 1: Log items before deletion
-- ============================================

-- Log cars to be deleted
INSERT INTO deletion_log (table_name, record_id, record_data, reason)
SELECT 
  'cars',
  id,
  to_jsonb(cars.*),
  'Test/placeholder data cleanup'
FROM cars 
WHERE 
  lower(title) LIKE '%test%' 
  OR lower(description) LIKE '%test%'
  OR lower(title) LIKE '%sample%'
  OR lower(title) LIKE '%dummy%'
  OR lower(title) LIKE '%placeholder%';

-- Log users to be deleted (ONLY run if explicitly approved)
-- Uncomment only after manual review and approval
/*
INSERT INTO deletion_log (table_name, record_id, record_data, reason)
SELECT 
  'users',
  id,
  to_jsonb(users.*),
  'Test user cleanup'
FROM users 
WHERE 
  lower(full_name) LIKE '%test%'
  OR lower(full_name) LIKE '%sample%'
  OR lower(full_name) LIKE '%dummy%';
*/

-- ============================================
-- STEP 2: Delete related bookings first (cascade)
-- ============================================

DELETE FROM bookings
WHERE car_id IN (
  SELECT id FROM cars 
  WHERE 
    lower(title) LIKE '%test%' 
    OR lower(description) LIKE '%test%'
    OR lower(title) LIKE '%sample%'
    OR lower(title) LIKE '%dummy%'
    OR lower(title) LIKE '%placeholder%'
);

-- ============================================
-- STEP 3: Delete test cars
-- ============================================

DELETE FROM cars 
WHERE 
  lower(title) LIKE '%test%' 
  OR lower(description) LIKE '%test%'
  OR lower(title) LIKE '%sample%'
  OR lower(title) LIKE '%dummy%'
  OR lower(title) LIKE '%placeholder%';

-- ============================================
-- STEP 4: Delete test users (MANUAL APPROVAL REQUIRED)
-- ============================================
-- ⚠️ ONLY uncomment after explicit approval and manual verification
-- ⚠️ Never delete real user accounts!
/*
DELETE FROM users 
WHERE 
  lower(full_name) LIKE '%test%'
  OR lower(full_name) LIKE '%sample%'
  OR lower(full_name) LIKE '%dummy%'
  AND created_at < '2025-01-01'; -- Add appropriate date filter
*/

-- ============================================
-- STEP 5: Verify deletion counts
-- ============================================

SELECT 
  table_name,
  COUNT(*) as deleted_count,
  MIN(deleted_at) as first_deletion,
  MAX(deleted_at) as last_deletion
FROM deletion_log
WHERE deleted_at > now() - interval '1 hour'
GROUP BY table_name;

-- ============================================
-- STORAGE CLEANUP NOTES
-- ============================================
-- After running this script, manually clean storage:
-- 1. Go to Supabase Dashboard > Storage > cars-photos
-- 2. Review folders with test/sample/dummy patterns
-- 3. Delete files where image_paths don't exist in cars table
-- 4. Document deleted file paths in deletion-log.json (create via script)

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To restore deleted data:
/*
-- 1. Get deleted record IDs from log
SELECT record_id, record_data 
FROM deletion_log 
WHERE table_name = 'cars' 
AND deleted_at > now() - interval '1 day';

-- 2. Restore from backup tables
INSERT INTO cars 
SELECT * FROM cars_backup_20250101 
WHERE id IN (SELECT record_id FROM deletion_log WHERE table_name = 'cars');
*/
