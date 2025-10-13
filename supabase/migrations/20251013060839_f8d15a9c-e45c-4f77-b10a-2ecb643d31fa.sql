-- Security Fix: Add authentication requirement to bookings and messages tables
-- Prevents anonymous public access to sensitive data

-- Fix bookings table: Require authentication for SELECT
DROP POLICY IF EXISTS "bookings_select_no_anonymous" ON public.bookings;
CREATE POLICY "bookings_require_auth_select" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix messages table: Require authentication for SELECT  
DROP POLICY IF EXISTS "messages_select_no_anonymous" ON public.messages;
CREATE POLICY "messages_require_auth_select"
ON public.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (sender_id = auth.uid()) 
  OR (room_id LIKE 'support:' || auth.uid()::text || '%')
  OR EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.user_id = auth.uid() 
    AND messages.room_id = 'booking:' || b.id::text
  )
);

-- Security Fix: Set search_path on all SECURITY DEFINER functions
-- Prevents search_path manipulation attacks

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix is_admin function  
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.is_admin = TRUE
  );
$$;

-- Fix validate_promo_code function
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input text)
RETURNS TABLE(valid boolean, discount_percent integer, discount_flat numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix book_car_atomic function
CREATE OR REPLACE FUNCTION public.book_car_atomic(car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  IF NEW.email = 'rpcars2025@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix prevent_admin_escalation trigger function
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'admin'::public.app_role THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Access denied: Cannot assign admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;