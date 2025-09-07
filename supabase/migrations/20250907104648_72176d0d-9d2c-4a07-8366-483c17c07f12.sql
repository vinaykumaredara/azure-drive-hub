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
-- Create a corrected function to check if user is trying to modify is_admin
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check for UPDATE operations (OLD exists only in UPDATE)
  IF TG_OP = 'UPDATE' THEN
    -- Only allow admin modifications if the current user is already an admin
    IF OLD.is_admin != NEW.is_admin AND NOT is_admin() THEN
      RAISE EXCEPTION 'Access denied: Cannot modify admin status';
    END IF;
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

-- Update promo codes to be admin-only readable
CREATE POLICY "promo_codes_admin_select" ON public.promo_codes
FOR SELECT USING (is_admin());

-- Add usage tracking columns for promo codes
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;