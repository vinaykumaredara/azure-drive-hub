-- Migration for PR 2: Currency conversion and DB migration
-- Add columns for price in paise and currency to all relevant tables

-- Add price_in_paise and currency columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS price_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add total_amount_in_paise and currency columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add amount_in_paise and currency columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_price_paise ON public.cars(price_in_paise);
CREATE INDEX IF NOT EXISTS idx_bookings_amount_paise ON public.bookings(total_amount_in_paise);
CREATE INDEX IF NOT EXISTS idx_payments_amount_paise ON public.payments(amount_in_paise);

-- Comments for documentation
COMMENT ON COLUMN public.cars.price_in_paise IS 'Price stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.cars.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.bookings.total_amount_in_paise IS 'Total amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.bookings.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.payments.amount_in_paise IS 'Amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.payments.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';