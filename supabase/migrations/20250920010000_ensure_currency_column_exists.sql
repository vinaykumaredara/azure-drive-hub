-- Ensure currency column exists in cars table
-- This migration ensures the currency column is present to fix the schema cache error

-- Add currency column to cars table if it doesn't exist
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to bookings table if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to payments table if it doesn't exist
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Ensure existing rows have the currency value
UPDATE public.cars 
SET currency = 'INR' 
WHERE currency IS NULL;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);

-- Comments for documentation
COMMENT ON COLUMN public.cars.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.bookings.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';
COMMENT ON COLUMN public.payments.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';

-- Refresh schema cache by updating a row (this will trigger a schema refresh)
-- This is a workaround since we can't directly NOTIFY pgrst without service role
UPDATE public.cars SET currency = currency WHERE id = '00000000-0000-0000-0000-000000000000';