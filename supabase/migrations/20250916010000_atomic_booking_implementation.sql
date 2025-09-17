-- Migration for Atomic Booking Implementation
-- Add fields for atomic booking to cars table

-- Add booking-related columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_booking_status ON public.cars(booking_status);
CREATE INDEX IF NOT EXISTS idx_cars_booked_by ON public.cars(booked_by);
CREATE INDEX IF NOT EXISTS idx_cars_booked_at ON public.cars(booked_at);

-- Update existing cars to have booking_status = 'available' if they don't have it
UPDATE public.cars 
SET booking_status = 'available' 
WHERE booking_status IS NULL;

-- Ensure the is_admin column exists and is properly set
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update RLS policies for cars table
-- Public can only select published and available cars
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published' AND booking_status = 'available');

-- Admins can insert/update cars
DROP POLICY IF EXISTS "cars_modify_admin" ON public.cars;
CREATE POLICY "cars_modify_admin" ON public.cars
  FOR ALL USING (public.is_admin());

-- Create atomic booking function
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

-- Comments for documentation
COMMENT ON COLUMN public.cars.booking_status IS 'Current booking status of the car (available, booked)';
COMMENT ON COLUMN public.cars.booked_by IS 'User who booked the car';
COMMENT ON COLUMN public.cars.booked_at IS 'Timestamp when the car was booked';
COMMENT ON FUNCTION public.book_car_atomic IS 'Atomic function to book a car, ensuring no race conditions';