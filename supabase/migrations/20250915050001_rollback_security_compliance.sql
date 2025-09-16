-- Rollback migration for PR 5: Security & Compliance

-- Drop audit_logs table
DROP TABLE IF EXISTS public.audit_logs;