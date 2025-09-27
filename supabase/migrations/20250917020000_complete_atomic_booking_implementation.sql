-- Migration for Complete Atomic Booking Implementation
-- This migration includes all required components for atomic booking functionality

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

-- 2. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_booked_by ON public.cars(booked_by);
CREATE INDEX IF NOT EXISTS idx_cars_price_in_paise ON public.cars(price_in_paise);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- 3. Ensure booking-related columns exist in cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- 4. Backfill booking_status = 'available' for NULLs
UPDATE public.cars 
SET booking_status = 'available' 
WHERE booking_status IS NULL;

-- 5. Ensure the is_admin column exists in users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 6. Update RLS policies for cars table
-- Public can only select published cars (regardless of booking status for better user experience)
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- Admins can insert/update cars
DROP POLICY IF EXISTS "cars_modify_admin" ON public.cars;
CREATE POLICY "cars_modify_admin" ON public.cars
  FOR ALL USING (public.is_admin());

-- 7. Create bookings table RLS policies
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

-- 8. Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.cars TO authenticated;
GRANT ALL ON public.bookings TO authenticated;

-- Comments for documentation
COMMENT ON COLUMN public.cars.booking_status IS 'Current booking status of the car (available, booked)';
COMMENT ON COLUMN public.cars.booked_by IS 'User who booked the car';
COMMENT ON COLUMN public.cars.booked_at IS 'Timestamp when the car was booked';