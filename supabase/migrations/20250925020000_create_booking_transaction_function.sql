-- Migration to create booking transaction function
-- This function ensures atomic booking creation with proper validation

-- Create the booking transaction function
CREATE OR REPLACE FUNCTION public.create_booking_transaction(
  p_car_id UUID,
  p_user_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ,
  p_total_amount NUMERIC,
  p_pay_mode TEXT,
  p_license_path TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_booking_id UUID;
  v_payment_id UUID;
  v_hold_amount NUMERIC;
  v_hold_until TIMESTAMPTZ;
  v_booking_status TEXT;
  v_payment_status TEXT;
  v_car_booking_status TEXT;
  v_result JSONB;
BEGIN
  -- Lock the car row for update to prevent race conditions
  SELECT booking_status INTO v_car_booking_status
  FROM public.cars
  WHERE id = p_car_id
  FOR UPDATE;

  -- Check if car exists
  IF v_car_booking_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car not found'
    );
  END IF;

  -- Check if car is available
  IF v_car_booking_status != 'available' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car is not available for booking'
    );
  END IF;

  -- Check for overlapping bookings using the exclusion constraint approach
  IF EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE car_id = p_car_id 
    AND tstzrange(p_start_datetime, p_end_datetime) && booking_range
    AND status IN ('confirmed', 'held', 'pending')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car is not available for the selected dates'
    );
  END IF;

  -- Set booking and payment status based on payment mode
  IF p_pay_mode = 'hold' THEN
    v_booking_status := 'held';
    v_payment_status := 'partial_hold';
    v_hold_amount := ROUND(p_total_amount * 0.10);
    v_hold_until := NOW() + INTERVAL '24 hours';
  ELSE
    v_booking_status := 'pending';
    v_payment_status := 'unpaid';
    v_hold_amount := 0;
    v_hold_until := NULL;
  END IF;

  -- Create the booking
  INSERT INTO public.bookings (
    user_id,
    car_id,
    start_datetime,
    end_datetime,
    total_amount,
    status,
    payment_status,
    hold_amount,
    hold_expires_at,
    license_path
  ) VALUES (
    p_user_id,
    p_car_id,
    p_start_datetime,
    p_end_datetime,
    p_total_amount,
    v_booking_status,
    v_payment_status,
    v_hold_amount,
    v_hold_until,
    p_license_path
  ) RETURNING id INTO v_booking_id;

  -- Create payment record if hold mode
  IF p_pay_mode = 'hold' AND v_hold_amount > 0 THEN
    INSERT INTO public.payments (
      booking_id,
      user_id,
      amount,
      currency,
      status,
      payment_method
    ) VALUES (
      v_booking_id,
      p_user_id,
      v_hold_amount,
      'INR',
      'success',
      'hold'
    ) RETURNING id INTO v_payment_id;
  END IF;

  -- Update car status to booked
  UPDATE public.cars
  SET 
    booking_status = 'booked',
    booked_by = p_user_id,
    booked_at = NOW()
  WHERE id = p_car_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (action, description, user_id, metadata)
  VALUES (
    'booking_created',
    'Booking created via transaction function',
    p_user_id,
    jsonb_build_object(
      'booking_id', v_booking_id,
      'car_id', p_car_id,
      'pay_mode', p_pay_mode
    )
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking_id,
    'paymentId', v_payment_id,
    'holdAmount', v_hold_amount,
    'holdUntil', v_hold_until
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create booking: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_booking_transaction IS 'Atomic function to create a booking with proper validation and constraints';