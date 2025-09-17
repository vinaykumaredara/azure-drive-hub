-- Performance optimization migration for RP Cars platform
-- Adds indexes to commonly queried columns to improve query performance

-- Indexes for cars table
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_make ON public.cars(make);
CREATE INDEX IF NOT EXISTS idx_cars_model ON public.cars(model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON public.cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON public.cars(fuel_type);
CREATE INDEX IF NOT EXISTS idx_cars_transmission ON public.cars(transmission);
CREATE INDEX IF NOT EXISTS idx_cars_seats ON public.cars(seats);
CREATE INDEX IF NOT EXISTS idx_cars_location_city ON public.cars(location_city);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at);

-- Indexes for bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON public.bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_datetime ON public.bookings(start_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_end_datetime ON public.bookings(end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Indexes for promo_codes table
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_from ON public.promo_codes(valid_from);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_to ON public.promo_codes(valid_to);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cars_status_make_model ON public.cars(status, make, model);
CREATE INDEX IF NOT EXISTS idx_cars_location_status ON public.cars(location_city, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_car_status ON public.bookings(car_id, status);

-- Comments for documentation
COMMENT ON INDEX IF EXISTS idx_cars_status IS 'Index for filtering cars by status';
COMMENT ON INDEX IF EXISTS idx_cars_make IS 'Index for filtering cars by make';
COMMENT ON INDEX IF EXISTS idx_cars_model IS 'Index for filtering cars by model';
COMMENT ON INDEX IF EXISTS idx_cars_year IS 'Index for filtering cars by year';
COMMENT ON INDEX IF EXISTS idx_cars_fuel_type IS 'Index for filtering cars by fuel type';
COMMENT ON INDEX IF EXISTS idx_cars_transmission IS 'Index for filtering cars by transmission';
COMMENT ON INDEX IF EXISTS idx_cars_seats IS 'Index for filtering cars by seats';
COMMENT ON INDEX IF EXISTS idx_cars_location_city IS 'Index for filtering cars by location';
COMMENT ON INDEX IF EXISTS idx_cars_created_at IS 'Index for sorting cars by creation date';