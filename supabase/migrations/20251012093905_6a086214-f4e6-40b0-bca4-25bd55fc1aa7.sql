-- COMPREHENSIVE SECURITY FIX MIGRATION
-- This migration addresses all critical security vulnerabilities

-- 1. Create proper role-based access control system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (eliminates circular RLS dependency)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create secure has_role() function (replaces vulnerable is_admin())
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = '' -- CRITICAL: Empty search path prevents injection
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Migrate existing admin users to new role system
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.users
WHERE is_admin = TRUE
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Set all non-admin users as 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM public.users
WHERE is_admin = FALSE OR is_admin IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update all SECURITY DEFINER functions to use empty search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Fixed: empty search path
AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  -- Special case: make rpcars2025@gmail.com admin
  IF NEW.email = 'rpcars2025@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Fixed: empty search path
AS $$
BEGIN
  -- Prevent non-admins from assigning admin roles
  IF TG_OP = 'INSERT' AND NEW.role = 'admin'::public.app_role THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Access denied: Cannot assign admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input TEXT)
RETURNS TABLE(valid BOOLEAN, discount_percent INTEGER, discount_flat NUMERIC, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Fixed: empty search path
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

CREATE OR REPLACE FUNCTION public.book_car_atomic(car_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Fixed: empty search path
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

-- 7. DROP and RECREATE all RLS policies with authentication requirements

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;

CREATE POLICY "users_select_authenticated" ON public.users
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "users_insert_own" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_authenticated" ON public.users
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- LICENSES TABLE POLICIES
DROP POLICY IF EXISTS "licenses_owner_admin" ON public.licenses;

CREATE POLICY "licenses_select_authenticated" ON public.licenses
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "licenses_insert_own" ON public.licenses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "licenses_update_own" ON public.licenses
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "licenses_delete_admin" ON public.licenses
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- PAYMENTS TABLE POLICIES
DROP POLICY IF EXISTS "payments_owner_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_system" ON public.payments;

CREATE POLICY "payments_select_authenticated" ON public.payments
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id AND b.user_id = auth.uid()
    )
  )
);

CREATE POLICY "payments_insert_authenticated" ON public.payments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- BOOKINGS TABLE POLICIES
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_owner_or_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_authenticated" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_owner_or_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;

CREATE POLICY "bookings_select_authenticated" ON public.bookings
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "bookings_insert_authenticated" ON public.bookings
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  user_id = auth.uid()
);

CREATE POLICY "bookings_update_owner_or_admin" ON public.bookings
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "bookings_delete_admin" ON public.bookings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CARS TABLE POLICIES
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
DROP POLICY IF EXISTS "cars_modify_admin" ON public.cars;

CREATE POLICY "cars_select_published" ON public.cars
FOR SELECT
USING (status = 'published');

CREATE POLICY "cars_admin_all" ON public.cars
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs select - owner" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs select - admin" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insert - authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs update - admin only" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs delete - admin only" ON public.audit_logs;

CREATE POLICY "audit_logs_select_authenticated" ON public.audit_logs
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "audit_logs_update_admin" ON public.audit_logs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "audit_logs_delete_admin" ON public.audit_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- MESSAGES TABLE POLICIES
DROP POLICY IF EXISTS "messages_room_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_authenticated" ON public.messages;

CREATE POLICY "messages_select_authenticated" ON public.messages
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    sender_id = auth.uid() OR
    room_id LIKE 'support:' || auth.uid()::text || '%' OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.user_id = auth.uid() AND room_id = 'booking:' || b.id::text
    )
  )
);

CREATE POLICY "messages_insert_authenticated" ON public.messages
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  sender_id = auth.uid() -- CRITICAL: Prevents impersonation
);

-- USER_ROLES TABLE POLICIES
CREATE POLICY "user_roles_select_authenticated" ON public.user_roles
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_update_admin" ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. Add trigger to prevent privilege escalation
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.user_roles;
CREATE TRIGGER prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_escalation();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_booking_status ON public.cars(booking_status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);

-- 10. Add comments for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments - eliminates circular RLS dependencies';
COMMENT ON FUNCTION public.has_role IS 'Secure function to check user roles - uses empty search_path to prevent injection';
COMMENT ON COLUMN public.messages.sender_id IS 'Must match auth.uid() - prevents message impersonation';

-- Force schema refresh
NOTIFY pgrst, 'reload schema';