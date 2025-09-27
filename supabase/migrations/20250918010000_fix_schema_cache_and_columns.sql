-- Fix schema cache and ensure all required columns exist
-- This migration addresses the "Could not find the 'booking_status' column" error

-- 1. Ensure all required columns exist in cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS images TEXT[];

-- 2. Backfill booking_status = 'available' for NULLs
UPDATE public.cars 
SET booking_status = 'available' 
WHERE booking_status IS NULL;

-- 3. Backfill currency = 'INR' for NULLs
UPDATE public.cars 
SET currency = 'INR' 
WHERE currency IS NULL;

-- 4. Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID,
    actor_email TEXT,
    action TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_booked_by ON public.cars(booked_by);
CREATE INDEX IF NOT EXISTS idx_cars_price_in_paise ON public.cars(price_in_paise);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- 6. Update RLS policies for cars table
-- Public can only select published cars
DROP POLICY IF EXISTS "public_select_published" ON public.cars;
CREATE POLICY "public_select_published" ON public.cars
  FOR SELECT USING (status = 'published');

-- Admins can insert/update/delete cars
DROP POLICY IF EXISTS "admins_modify_cars" ON public.cars;
CREATE POLICY "admins_modify_cars" ON public.cars
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- 7. Ensure the is_admin column exists in users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 8. Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.cars TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit log for tracking admin actions and system events';
COMMENT ON COLUMN public.audit_logs.actor_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.actor_email IS 'Email of user who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN public.audit_logs.meta IS 'Additional metadata about the action';
COMMENT ON COLUMN public.audit_logs.created_at IS 'When the action was performed';

COMMENT ON COLUMN public.cars.booking_status IS 'Current booking status of the car (available, booked)';
COMMENT ON COLUMN public.cars.booked_by IS 'User who booked the car';
COMMENT ON COLUMN public.cars.booked_at IS 'Timestamp when the car was booked';
COMMENT ON COLUMN public.cars.price_in_paise IS 'Price in paise (smallest currency unit) for accurate calculations';
COMMENT ON COLUMN public.cars.currency IS 'Currency code (default: INR)';
COMMENT ON COLUMN public.cars.images IS 'Array of image URLs for the car';