-- Complete Migration Script
-- This script includes both currency support and atomic booking functionality

-- 1. Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.users(id),
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit log for tracking admin actions and system events';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN public.audit_logs.description IS 'Description of the action';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional metadata about the action';
COMMENT ON COLUMN public.audit_logs.timestamp IS 'When the action was performed';

-- 2. Ensure booking-related columns exist in cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- 3. Ensure currency-related columns exist in all tables
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS price_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 4. Ensure the is_admin column exists in users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 5. Add missing indexes for better performance (only after columns exist)
CREATE INDEX IF NOT EXISTS idx_cars_booked_by ON public.cars(booked_by);
CREATE INDEX IF NOT EXISTS idx_cars_price_in_paise ON public.cars(price_in_paise);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- 6. Create indexes for currency columns
CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);

-- 7. Backfill booking_status = 'available' for NULLs
UPDATE public.cars 
SET booking_status = 'available' 
WHERE booking_status IS NULL;

-- 8. Backfill currency = 'INR' for NULLs
UPDATE public.cars 
SET currency = 'INR' 
WHERE currency IS NULL;

UPDATE public.bookings 
SET currency = 'INR' 
WHERE currency IS NULL;

UPDATE public.payments 
SET currency = 'INR' 
WHERE currency IS NULL;

-- 9. Update RLS policies for cars table
-- Public can only select published cars (regardless of booking status for better user experience)
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- Admins can insert/update cars
DROP POLICY IF EXISTS "cars_modify_admin" ON public.cars;
CREATE POLICY "cars_modify_admin" ON public.cars
  FOR ALL USING (public.is_admin());

-- 10. Create bookings table RLS policies
-- Allow users to view their own bookings
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

-- Allow admins to view all bookings
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT USING (public.is_admin());

-- Allow users to insert their own bookings
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow admins to insert bookings
DROP POLICY IF EXISTS "bookings_insert_admin" ON public.bookings;
CREATE POLICY "bookings_insert_admin" ON public.bookings
  FOR INSERT WITH CHECK (public.is_admin());

-- Allow admins to update bookings
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE USING (public.is_admin());

-- 11. Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.cars TO authenticated;
GRANT ALL ON public.bookings TO authenticated;

-- 12. Create atomic booking function
CREATE OR REPLACE FUNCTION public.book_car_atomic(car_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  current_booking_status TEXT;
BEGIN
  -- Lock the row for update
  SELECT booking_status INTO current_booking_status
  FROM public.cars
  WHERE id = car_id
  FOR UPDATE;

  -- Check if car exists and is available
  IF current_booking_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Car not found'
    );
  END IF;

  IF current_booking_status != 'available' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Car is already booked'
    );
  END IF;

  -- Update the car to mark it as booked
  UPDATE public.cars
  SET 
    booking_status = 'booked',
    booked_by = auth.uid(),
    booked_at = NOW()
  WHERE id = car_id;

  -- Insert audit log entry
  INSERT INTO public.audit_logs (action, description, user_id, metadata)
  VALUES (
    'car_booked',
    'Car booked atomically',
    auth.uid(),
    jsonb_build_object(
      'car_id', car_id,
      'booked_at', NOW()
    )
  );

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Car booked successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to book car: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add comments for documentation
COMMENT ON COLUMN public.cars.booking_status IS 'Current booking status of the car (available, booked)';
COMMENT ON COLUMN public.cars.booked_by IS 'User who booked the car';
COMMENT ON COLUMN public.cars.booked_at IS 'Timestamp when the car was booked';
COMMENT ON COLUMN public.cars.price_in_paise IS 'Price stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.cars.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.bookings.total_amount_in_paise IS 'Total amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.bookings.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.payments.amount_in_paise IS 'Amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.payments.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON FUNCTION public.book_car_atomic IS 'Atomic function to book a car, ensuring no race conditions';

-- 14. Create auto-reload trigger function
CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- 15. Create event trigger
DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;
CREATE EVENT TRIGGER pgrst_reload_on_ddl
ON ddl_command_end
EXECUTE FUNCTION pgrst_reload_on_ddl();

-- 16. Force a schema refresh
NOTIFY pgrst, 'reload schema';