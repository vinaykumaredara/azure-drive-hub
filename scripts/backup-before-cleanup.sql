-- ============================================
-- Backup Script - Run BEFORE Any Cleanup
-- ============================================
-- Purpose: Create backup tables for safe rollback
-- Usage: Run in Supabase SQL Editor BEFORE running cleanup scripts

-- ============================================
-- 1. BACKUP CARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cars_backup_20250101 AS 
SELECT * FROM cars;

-- Verify backup
SELECT COUNT(*) as original_count FROM cars;
SELECT COUNT(*) as backup_count FROM cars_backup_20250101;

-- ============================================
-- 2. BACKUP USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users_backup_20250101 AS 
SELECT * FROM users;

-- Verify backup
SELECT COUNT(*) as original_count FROM users;
SELECT COUNT(*) as backup_count FROM users_backup_20250101;

-- ============================================
-- 3. BACKUP BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings_backup_20250101 AS 
SELECT * FROM bookings;

-- Verify backup
SELECT COUNT(*) as original_count FROM bookings;
SELECT COUNT(*) as backup_count FROM bookings_backup_20250101;

-- ============================================
-- 4. CREATE DELETION LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  record_data jsonb,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by text,
  reason text
);

-- ============================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================
-- To restore from backup:
/*
-- Restore cars
DELETE FROM cars;
INSERT INTO cars SELECT * FROM cars_backup_20250101;

-- Restore users
DELETE FROM users;
INSERT INTO users SELECT * FROM users_backup_20250101;

-- Restore bookings
DELETE FROM bookings;
INSERT INTO bookings SELECT * FROM bookings_backup_20250101;
*/

-- ============================================
-- CLEANUP BACKUP TABLES (after verification)
-- ============================================
-- After confirming everything works, drop backup tables:
/*
DROP TABLE IF EXISTS cars_backup_20250101;
DROP TABLE IF EXISTS users_backup_20250101;
DROP TABLE IF EXISTS bookings_backup_20250101;
*/
