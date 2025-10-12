-- Security Fix: Address Critical RLS and Function Vulnerabilities
-- This migration fixes 4 error-level security issues identified in the security scan

-- Fix 1: Users table - Ensure anonymous access is blocked
-- Drop and recreate the SELECT policy to guarantee authentication requirement
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
CREATE POLICY "users_select_authenticated" ON public.users
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role))
);

-- Fix 2: Licenses table - Ensure anonymous access is blocked
-- Drop all existing SELECT policies and create a single secure one
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.licenses;
DROP POLICY IF EXISTS "licenses_select_authenticated" ON public.licenses;
CREATE POLICY "licenses_select_authenticated" ON public.licenses
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
);

-- Fix 3: Payments table - Ensure anonymous access is blocked
-- Recreate policy with explicit authentication check
DROP POLICY IF EXISTS "payments_select_authenticated" ON public.payments;
CREATE POLICY "payments_select_authenticated" ON public.payments
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   EXISTS (
     SELECT 1 FROM public.bookings b 
     WHERE b.id = payments.booking_id 
     AND b.user_id = auth.uid()
   ))
);

-- Fix 4: is_admin() function - Fix search_path vulnerability
-- Change search_path from 'public' to '' (empty) to prevent search path attacks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.is_admin = TRUE
  );
$$;

-- Also fix other SECURITY DEFINER functions with vulnerable search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'admin'::public.app_role THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Access denied: Cannot assign admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input text)
RETURNS TABLE(valid boolean, discount_percent integer, discount_flat numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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