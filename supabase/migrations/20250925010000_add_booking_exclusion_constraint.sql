-- Migration to add EXCLUDE constraint to prevent overlapping bookings
-- This ensures database-level protection against double bookings

-- Enable btree_gist extension if not already enabled
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add booking_range column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_range tstzrange 
GENERATED ALWAYS AS (tstzrange(start_datetime, end_datetime)) STORED;

-- Add EXCLUDE constraint to prevent overlapping bookings for the same car
-- This will prevent two bookings for the same car with overlapping time ranges
ALTER TABLE public.bookings 
ADD CONSTRAINT no_overlapping_bookings 
EXCLUDE USING gist (car_id WITH =, booking_range WITH &&)
WHERE (status IN ('confirmed', 'held', 'pending'));

-- Add index for better performance on booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_car_id_range ON public.bookings (car_id, booking_range);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.booking_range IS 'Time range for the booking (generated from start_datetime and end_datetime)';
COMMENT ON CONSTRAINT no_overlapping_bookings ON public.bookings IS 'Prevents overlapping bookings for the same car';