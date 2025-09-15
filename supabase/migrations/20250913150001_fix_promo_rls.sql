-- Fix promo code RLS policies for admin CRUD operations
-- Add missing policies for insert, update, delete operations

-- Admin can insert promo codes
CREATE POLICY "promo_codes_admin_insert" ON public.promo_codes
FOR INSERT USING (is_admin())
WITH CHECK (is_admin());

-- Admin can update promo codes
CREATE POLICY "promo_codes_admin_update" ON public.promo_codes
FOR UPDATE USING (is_admin())
WITH CHECK (is_admin());

-- Admin can delete promo codes
CREATE POLICY "promo_codes_admin_delete" ON public.promo_codes
FOR DELETE USING (is_admin());

-- Ensure the promo code validation function can still access promo codes
-- for regular users (needed for the validate_promo_code function)
CREATE POLICY "promo_codes_validate_function" ON public.promo_codes
FOR SELECT USING (auth.role() = 'authenticated');

-- Also ensure users can read their available promo codes through the PromoCodeInput component
-- This allows the fetchAvailablePromos function to work
CREATE POLICY "promo_codes_user_select_active" ON public.promo_codes
FOR SELECT USING (active = true AND (valid_to IS NULL OR valid_to >= CURRENT_DATE));