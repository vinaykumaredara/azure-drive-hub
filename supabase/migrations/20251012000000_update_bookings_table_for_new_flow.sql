-- Migration to update bookings table for new booking flow
-- This ensures all required columns exist for the new implementation

-- Add license_path column to bookings table if it doesn't exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS license_path TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.license_path IS 'Storage path for user driver license document for this booking';

-- Ensure the booking_range column exists (should already exist from previous migration)
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_range tstzrange 
  GENERATED ALWAYS AS (tstzrange(start_datetime, end_datetime)) STORED;

-- Ensure the EXCLUDE constraint exists
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

ALTER TABLE public.bookings 
  ADD CONSTRAINT no_overlapping_bookings 
  EXCLUDE USING gist (car_id WITH =, booking_range WITH &&)
  WHERE (status IN ('confirmed', 'held', 'pending'));

-- Create index for better performance on booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_car_id_range ON public.bookings (car_id, booking_range);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.booking_range IS 'Time range for the booking (generated from start_datetime and end_datetime)';
COMMENT ON CONSTRAINT no_overlapping_bookings ON public.bookings IS 'Prevents overlapping bookings for the same car';