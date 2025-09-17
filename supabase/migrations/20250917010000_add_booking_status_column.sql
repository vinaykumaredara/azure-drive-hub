-- Migration to add booking_status column to cars table
-- This was accidentally removed during rollback of atomic booking implementation

-- Add booking-related columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- Update existing cars to have booking_status = 'available' if they don't have it
UPDATE public.cars 
SET booking_status = 'available' 
WHERE booking_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_booking_status ON public.cars(booking_status);
CREATE INDEX IF NOT EXISTS idx_cars_booked_by ON public.cars(booked_by);
CREATE INDEX IF NOT EXISTS idx_cars_booked_at ON public.cars(booked_at);

-- Update RLS policies for cars table
-- Public can only select published and available cars
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published' AND booking_status = 'available');

-- Comments for documentation
COMMENT ON COLUMN public.cars.booking_status IS 'Current booking status of the car (available, booked)';
COMMENT ON COLUMN public.cars.booked_by IS 'User who booked the car';
COMMENT ON COLUMN public.cars.booked_at IS 'Timestamp when the car was booked';