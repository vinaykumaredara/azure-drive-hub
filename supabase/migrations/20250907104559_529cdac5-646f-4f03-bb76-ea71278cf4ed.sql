-- CRITICAL SECURITY FIX 1: Fix promotional code exposure
-- Remove the overly permissive policy that makes all promo codes public
DROP POLICY IF EXISTS "promo_codes_select_all" ON public.promo_codes;

-- Create secure promo code validation function that only returns validity status
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  discount_percent INTEGER,
  discount_flat NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Find the promo code
  SELECT * INTO promo_record
  FROM promo_codes 
  WHERE code = code_input AND active = true;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check validity dates
  IF promo_record.valid_from IS NOT NULL AND CURRENT_DATE < promo_record.valid_from THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Promo code not yet active'::TEXT;
    RETURN;
  END IF;
  
  IF promo_record.valid_to IS NOT NULL AND CURRENT_DATE > promo_record.valid_to THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::NUMERIC, 'Promo code has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Code is valid, return discount info
  RETURN QUERY SELECT 
    true,
    promo_record.discount_percent,
    promo_record.discount_flat,
    'Valid promo code'::TEXT;
END;
$$;

-- CRITICAL SECURITY FIX 2: Prevent admin privilege escalation
-- Add constraint to prevent is_admin column modification by regular users
-- First, create a function to check if user is trying to modify is_admin
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin modifications if the current user is already an admin
  IF OLD.is_admin != NEW.is_admin AND NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Cannot modify admin status';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent admin privilege escalation
DROP TRIGGER IF EXISTS prevent_admin_escalation_trigger ON public.users;
CREATE TRIGGER prevent_admin_escalation_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_escalation();

-- Update RLS policy to be more explicit about what users can update
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
CREATE POLICY "users_update_own_non_admin_fields" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Ensure is_admin field hasn't changed (will be blocked by trigger anyway)
  OLD.is_admin = NEW.is_admin
);

-- Separate policy for admin updates
CREATE POLICY "users_update_admin" ON public.users
FOR UPDATE USING (is_admin())
WITH CHECK (true);

-- Add usage tracking for promo codes
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create promo code usage log table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on promo code usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Only admins can see usage data
CREATE POLICY "promo_usage_admin_only" ON public.promo_code_usage
FOR ALL USING (is_admin());

-- Update promo codes to be admin-only readable
CREATE POLICY "promo_codes_admin_select" ON public.promo_codes
FOR SELECT USING (is_admin());

-- Function to apply promo code and track usage
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  code_input TEXT,
  booking_id_input UUID,
  base_amount NUMERIC
)
RETURNS TABLE(
  success BOOLEAN,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo_record RECORD;
  calculated_discount NUMERIC;
  user_id_val UUID;
BEGIN
  -- Get user from booking
  SELECT b.user_id INTO user_id_val FROM bookings b WHERE b.id = booking_id_input;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, base_amount, 'Invalid booking'::TEXT;
    RETURN;
  END IF;

  -- Validate promo code
  SELECT * INTO promo_record FROM validate_promo_code(code_input);
  
  IF NOT promo_record.valid THEN
    RETURN QUERY SELECT false, 0::NUMERIC, base_amount, promo_record.message;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF promo_record.discount_percent IS NOT NULL THEN
    calculated_discount := base_amount * (promo_record.discount_percent::NUMERIC / 100);
  ELSIF promo_record.discount_flat IS NOT NULL THEN
    calculated_discount := promo_record.discount_flat;
  ELSE
    calculated_discount := 0;
  END IF;
  
  -- Ensure discount doesn't exceed base amount
  calculated_discount := LEAST(calculated_discount, base_amount);
  
  -- Log usage
  INSERT INTO promo_code_usage (promo_code_id, user_id, booking_id, discount_applied)
  SELECT p.id, user_id_val, booking_id_input, calculated_discount
  FROM promo_codes p WHERE p.code = code_input;
  
  -- Update usage count
  UPDATE promo_codes 
  SET times_used = times_used + 1, last_used_at = now()
  WHERE code = code_input;
  
  RETURN QUERY SELECT 
    true, 
    calculated_discount, 
    base_amount - calculated_discount,
    'Promo code applied successfully'::TEXT;
END;
$$;