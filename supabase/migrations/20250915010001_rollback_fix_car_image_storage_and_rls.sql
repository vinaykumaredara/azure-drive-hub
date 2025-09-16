-- Rollback migration for car image storage and RLS fixes

-- Restore original RLS policy
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (TRUE);

-- Drop audit_logs table
DROP TABLE IF EXISTS public.audit_logs;

-- Drop system_settings table
DROP TABLE IF EXISTS public.system_settings;