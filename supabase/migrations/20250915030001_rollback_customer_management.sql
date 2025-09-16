-- Rollback migration for PR 3: Customer Management

-- Drop indexes
DROP INDEX IF EXISTS idx_users_suspended;
DROP INDEX IF EXISTS idx_users_suspended_at;

-- Remove suspension columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS is_suspended,
DROP COLUMN IF EXISTS suspension_reason,
DROP COLUMN IF EXISTS suspended_at,
DROP COLUMN IF EXISTS suspended_by;