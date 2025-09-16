-- Rollback migration for PR 2: Currency conversion and DB migration

-- Drop indexes
DROP INDEX IF EXISTS idx_cars_price_paise;
DROP INDEX IF EXISTS idx_bookings_amount_paise;
DROP INDEX IF EXISTS idx_payments_amount_paise;

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