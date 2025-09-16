-- Migration to add price_in_paise and currency columns to cars table
-- This migration adds support for Indian Rupee pricing in paise

-- Add new columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS price_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add new columns to bookings table for consistency
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add new columns to payments table for consistency
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS amount_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update existing cars with price_in_paise values (assuming current prices are in USD)
-- This is a placeholder - actual conversion should be done with business approval
UPDATE public.cars 
SET price_in_paise = (price_per_day * 8300)::BIGINT,  -- Approximate USD to INR conversion
    currency = 'INR'
WHERE price_in_paise IS NULL;

-- Update existing bookings with total_amount_in_paise values
UPDATE public.bookings 
SET total_amount_in_paise = (total_amount * 8300)::BIGINT,
    currency = 'INR'
WHERE total_amount_in_paise IS NULL;

-- Update existing payments with amount_in_paise values
UPDATE public.payments 
SET amount_in_paise = (amount * 8300)::BIGINT,
    currency = 'INR'
WHERE amount_in_paise IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_price_paise ON cars(price_in_paise);
CREATE INDEX IF NOT EXISTS idx_bookings_amount_paise ON bookings(total_amount_in_paise);
CREATE INDEX IF NOT EXISTS idx_payments_amount_paise ON payments(amount_in_paise);

-- Update RLS policies to use 'published' status instead of 'active'
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- Comments for documentation
COMMENT ON COLUMN public.cars.price_in_paise IS 'Price stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.cars.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.bookings.total_amount_in_paise IS 'Total amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.bookings.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.payments.amount_in_paise IS 'Amount stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.payments.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';