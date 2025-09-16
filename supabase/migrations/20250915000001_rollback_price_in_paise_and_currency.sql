-- Rollback migration to remove price_in_paise and currency columns
-- This migration reverts the changes made in 20250915000000_add_price_in_paise_and_currency.sql

-- Drop indexes
DROP INDEX IF EXISTS idx_cars_price_paise;
DROP INDEX IF EXISTS idx_bookings_amount_paise;
DROP INDEX IF EXISTS idx_payments_amount_paise;

-- Restore original RLS policy
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (TRUE);

-- Remove columns from payments table
ALTER TABLE public.payments 
DROP COLUMN IF EXISTS amount_in_paise,
DROP COLUMN IF EXISTS currency;

-- Remove columns from bookings table
ALTER TABLE public.bookings 
DROP COLUMN IF EXISTS total_amount_in_paise,
DROP COLUMN IF EXISTS currency;

-- Remove columns from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS price_in_paise,
DROP COLUMN IF EXISTS currency;