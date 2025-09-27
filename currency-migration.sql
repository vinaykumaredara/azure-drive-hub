-- Currency Migration Script
-- This script adds currency support to the cars, bookings, and payments tables

-- Add currency column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update existing rows with currency values
UPDATE public.cars SET currency = 'INR' WHERE currency IS NULL;
UPDATE public.bookings SET currency = 'INR' WHERE currency IS NULL;
UPDATE public.payments SET currency = 'INR' WHERE currency IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);

-- Create auto-reload trigger function
CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- Create event trigger
DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;
CREATE EVENT TRIGGER pgrst_reload_on_ddl
ON ddl_command_end
EXECUTE FUNCTION pgrst_reload_on_ddl();

-- Force a schema refresh
NOTIFY pgrst, 'reload schema';