-- Create atomic booking function with proper error handling
-- This function ensures atomic booking operations to prevent race conditions

CREATE OR REPLACE FUNCTION public.book_car_atomic(car_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT booking_status INTO current_status 
  FROM public.cars 
  WHERE id = car_id 
  FOR UPDATE;

  -- Check if car exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Car not found'::TEXT;
    RETURN;
  END IF;

  -- Check if car is already booked
  IF current_status = 'booked' THEN
    RETURN QUERY SELECT false, 'Car already booked'::TEXT;
    RETURN;
  END IF;

  -- Update the car to mark it as booked
  UPDATE public.cars
  SET 
    booking_status = 'booked',
    booked_by = auth.uid(),
    booked_at = NOW()
  WHERE id = car_id;

  -- Insert audit log entry
  INSERT INTO public.audit_logs(actor_id, actor_email, action, meta)
  VALUES (
    auth.uid(),
    (SELECT email FROM public.users WHERE id = auth.uid()),
    'book_car',
    jsonb_build_object('car_id', car_id)
  );

  -- Return success
  RETURN QUERY SELECT true, 'Booked successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, ('Failed to book car: ' || SQLERRM)::TEXT;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.book_car_atomic IS 'Atomic function to book a car, ensuring no race conditions';