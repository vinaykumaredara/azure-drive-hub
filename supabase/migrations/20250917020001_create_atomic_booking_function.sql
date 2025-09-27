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

-- Add comment for documentation
COMMENT ON FUNCTION public.book_car_atomic IS 'Atomic function to book a car, ensuring no race conditions';