-- Rollback migration for Complete Atomic Booking Implementation

-- 1. Drop the atomic booking function
DROP FUNCTION IF EXISTS public.book_car_atomic(UUID);

-- 2. Remove booking-related columns from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS booking_status,
DROP COLUMN IF EXISTS booked_by,
DROP COLUMN IF EXISTS booked_at;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_cars_booked_by;
DROP INDEX IF EXISTS idx_cars_price_in_paise;
DROP INDEX IF EXISTS idx_cars_status;

-- 4. Drop audit_logs table
DROP TABLE IF EXISTS public.audit_logs;

-- 5. Restore original RLS policy for cars
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- 6. Remove is_admin column from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS is_admin;