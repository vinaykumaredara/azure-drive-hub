-- Rollback migration for PR 4: System Settings

-- Drop system_settings table
DROP TABLE IF EXISTS public.system_settings;