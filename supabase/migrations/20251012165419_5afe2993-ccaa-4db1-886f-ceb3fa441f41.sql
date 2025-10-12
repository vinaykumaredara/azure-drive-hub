-- Security Fixes: Storage Limits, RLS Policies, and Function Search Paths
-- This migration addresses multiple security vulnerabilities

-- Fix 1: Add file size limits to storage buckets
-- Prevent storage exhaustion and cost abuse
UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5MB limit for license documents
WHERE id = 'license-uploads';

UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10MB limit for car photos
WHERE id = 'cars-photos';

UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5MB limit for chat attachments
WHERE id = 'chat-attachments';

-- Fix 2: Update has_role function to have fixed search_path
-- Prevents search_path manipulation attacks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- Fixed search_path
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix 3: Update is_admin function to have fixed search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- Fixed search_path
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.is_admin = TRUE
  );
$function$;

-- Fix 4: Update validate_promo_code function to have fixed search_path
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input text)
RETURNS TABLE(valid boolean, discount_percent integer, discount_flat numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Fixed search_path
AS $function$
DECLARE
  promo_record RECORD;
BEGIN
  SELECT * INTO promo_record
  FROM public.promo_codes 
  WHERE code = code_input AND active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;
  
  IF promo_record.valid_from IS NOT NULL AND CURRENT_DATE < promo_record.valid_from THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Promo code not yet active'::TEXT;
    RETURN;
  END IF;
  
  IF promo_record.valid_to IS NOT NULL AND CURRENT_DATE > promo_record.valid_to THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Promo code has expired'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true,
    promo_record.discount_percent,
    promo_record.discount_flat,
    'Valid promo code'::TEXT;
END;
$function$;

-- Fix 5: Update book_car_atomic function to have fixed search_path
CREATE OR REPLACE FUNCTION public.book_car_atomic(car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Fixed search_path
AS $function$
DECLARE
  result JSONB;
  current_booking_status TEXT;
BEGIN
  SELECT booking_status INTO current_booking_status
  FROM public.cars
  WHERE id = car_id
  FOR UPDATE;

  IF current_booking_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Car not found');
  END IF;

  IF current_booking_status != 'available' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Car is already booked');
  END IF;

  UPDATE public.cars
  SET 
    booking_status = 'booked',
    booked_by = auth.uid(),
    booked_at = NOW()
  WHERE id = car_id;

  INSERT INTO public.audit_logs (action, description, user_id, metadata)
  VALUES (
    'car_booked',
    'Car booked atomically',
    auth.uid(),
    jsonb_build_object('car_id', car_id, 'booked_at', NOW())
  );

  RETURN jsonb_build_object('success', true, 'message', 'Car booked successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Failed to book car: ' || SQLERRM);
END;
$function$;