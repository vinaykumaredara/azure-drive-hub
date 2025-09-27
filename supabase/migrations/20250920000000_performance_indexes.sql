-- Performance optimization indexes for Azure Drive Hub
-- This migration adds indexes to improve query performance

-- Index on cars.status for faster filtering of published cars
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- Index on cars.booking_status for faster filtering of available cars
CREATE INDEX IF NOT EXISTS idx_cars_booking_status ON public.cars(booking_status);

-- Index on cars.created_at for faster sorting by creation date
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at);

-- Index on cars.price_in_paise for faster price-based queries
CREATE INDEX IF NOT EXISTS idx_cars_price_in_paise ON public.cars(price_in_paise);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_cars_status_booking_created ON public.cars(status, booking_status, created_at);

-- Index on bookings.user_id for faster user-specific booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Index on bookings.car_id for faster car-specific booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON public.bookings(car_id);

-- Index on bookings.status for faster booking status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Comments for documentation
COMMENT ON INDEX IF EXISTS idx_cars_status IS 'Index for filtering cars by status';
COMMENT ON INDEX IF EXISTS idx_cars_booking_status IS 'Index for filtering cars by booking status';
COMMENT ON INDEX IF EXISTS idx_cars_created_at IS 'Index for sorting cars by creation date';
COMMENT ON INDEX IF EXISTS idx_cars_price_in_paise IS 'Index for price-based queries';
COMMENT ON INDEX IF EXISTS idx_cars_status_booking_created IS 'Composite index for common car query patterns';
COMMENT ON INDEX IF EXISTS idx_bookings_user_id IS 'Index for user-specific booking queries';
COMMENT ON INDEX IF EXISTS idx_bookings_car_id IS 'Index for car-specific booking queries';
COMMENT ON INDEX IF EXISTS idx_bookings_status IS 'Index for booking status queries';