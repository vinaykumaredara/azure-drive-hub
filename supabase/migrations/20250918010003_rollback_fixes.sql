-- Rollback migration for schema fixes
-- This migration can be used to revert the changes if needed

-- 1. Drop the policies
DROP POLICY IF EXISTS "public_select_published" ON public.cars;
DROP POLICY IF EXISTS "admins_modify_cars" ON public.cars;
DROP POLICY IF EXISTS "admins_manage_system_settings" ON public.system_settings;

-- 2. Drop the system_settings table
DROP TABLE IF EXISTS public.system_settings;

-- 3. Drop the atomic booking function
DROP FUNCTION IF EXISTS public.book_car_atomic(UUID);

-- Note: We're not dropping the columns or audit_logs table as they might be in use
-- The columns will remain but won't cause issues if not used