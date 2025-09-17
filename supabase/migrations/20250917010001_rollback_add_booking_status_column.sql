-- Rollback migration for adding booking_status column

-- Remove booking-related columns from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS booking_status,
DROP COLUMN IF EXISTS booked_by,
DROP COLUMN IF EXISTS booked_at;

-- Restore original RLS policy for cars
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- Drop indexes
DROP INDEX IF EXISTS idx_cars_booking_status;
DROP INDEX IF EXISTS idx_cars_booked_by;
DROP INDEX IF EXISTS idx_cars_booked_at;