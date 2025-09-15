-- Performance optimization migration
-- Adding indexes and optimized functions for better query performance

-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_status_location 
ON cars(status, location_city) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_price_range 
ON cars(price_per_day) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_search 
ON cars USING gin(to_tsvector('english', title || ' ' || make || ' ' || model));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_created 
ON bookings(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_status 
ON bookings(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created 
ON payments(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_promo_codes_active 
ON promo_codes(active, valid_to) WHERE active = true;

-- Optimized dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  today_start TIMESTAMP := CURRENT_DATE;
BEGIN
  SELECT json_build_object(
    'total_cars', (
      SELECT COUNT(*) FROM cars WHERE status = 'active'
    ),
    'active_bookings', (
      SELECT COUNT(*) FROM bookings 
      WHERE status IN ('confirmed', 'active')
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(amount), 0) FROM payments 
      WHERE status = 'completed' 
      AND created_at >= today_start
    ),
    'total_customers', (
      SELECT COUNT(*) FROM users WHERE is_admin = false
    ),
    'pending_licenses', (
      SELECT COUNT(*) FROM licenses WHERE verified IS NULL
    ),
    'active_promos', (
      SELECT COUNT(*) FROM promo_codes 
      WHERE active = true 
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ),
    'bookings_this_week', (
      SELECT COUNT(*) FROM bookings 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'revenue_this_month', (
      SELECT COALESCE(SUM(amount), 0) FROM payments 
      WHERE status = 'completed' 
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Optimized car search function with full-text search
CREATE OR REPLACE FUNCTION search_cars(
  search_term TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  fuel_type_filter TEXT DEFAULT NULL,
  transmission_filter TEXT DEFAULT NULL,
  seats_filter INTEGER DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  seats INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  price_per_day NUMERIC,
  service_charge NUMERIC,
  location_city TEXT,
  image_urls TEXT[],
  relevance_score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.make,
    c.model,
    c.year,
    c.seats,
    c.fuel_type,
    c.transmission,
    c.price_per_day,
    c.service_charge,
    c.location_city,
    c.image_urls,
    CASE 
      WHEN search_term IS NOT NULL THEN
        ts_rank(to_tsvector('english', c.title || ' ' || c.make || ' ' || c.model), 
                plainto_tsquery('english', search_term))
      ELSE 1.0
    END as relevance_score
  FROM cars c
  WHERE c.status = 'active'
    AND (search_term IS NULL OR 
         to_tsvector('english', c.title || ' ' || c.make || ' ' || c.model) @@ 
         plainto_tsquery('english', search_term))
    AND (location_filter IS NULL OR c.location_city = location_filter)
    AND (min_price IS NULL OR c.price_per_day >= min_price)
    AND (max_price IS NULL OR c.price_per_day <= max_price)
    AND (fuel_type_filter IS NULL OR c.fuel_type = fuel_type_filter)
    AND (transmission_filter IS NULL OR c.transmission = transmission_filter)
    AND (seats_filter IS NULL OR c.seats = seats_filter)
  ORDER BY 
    CASE WHEN search_term IS NOT NULL THEN relevance_score ELSE 1 END DESC,
    c.price_per_day ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Optimized analytics function
CREATE OR REPLACE FUNCTION get_analytics_data(period_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP := CURRENT_DATE - INTERVAL '%s days';
BEGIN
  start_date := CURRENT_DATE - (period_days || ' days')::INTERVAL;
  
  SELECT json_build_object(
    'overview', json_build_object(
      'total_bookings', (SELECT COUNT(*) FROM bookings WHERE created_at >= start_date),
      'confirmed_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND created_at >= start_date),
      'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= start_date),
      'average_booking_value', (SELECT COALESCE(AVG(total_amount), 0) FROM bookings WHERE status = 'confirmed' AND created_at >= start_date),
      'conversion_rate', (
        SELECT CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(*) FILTER (WHERE status = 'confirmed'))::NUMERIC / COUNT(*) * 100, 2)
          ELSE 0 
        END
        FROM bookings 
        WHERE created_at >= start_date
      )
    ),
    'popular_cars', (
      SELECT json_agg(
        json_build_object(
          'car_id', car_id,
          'title', c.title,
          'make', c.make,
          'model', c.model,
          'booking_count', booking_count
        )
      )
      FROM (
        SELECT 
          b.car_id, 
          COUNT(*) as booking_count
        FROM bookings b
        WHERE b.status = 'confirmed' 
        AND b.created_at >= start_date
        GROUP BY b.car_id
        ORDER BY booking_count DESC
        LIMIT 5
      ) popular
      JOIN cars c ON c.id = popular.car_id
    ),
    'daily_stats', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'bookings', bookings,
          'revenue', revenue,
          'confirmed', confirmed
        ) ORDER BY date
      )
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'confirmed'), 0) as revenue
        FROM bookings
        WHERE created_at >= start_date
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      ) daily
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to clean up old data and optimize performance
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up old cancelled bookings (older than 1 year)
  DELETE FROM bookings 
  WHERE status = 'cancelled' 
  AND created_at < CURRENT_DATE - INTERVAL '1 year';
  
  -- Clean up old failed payments (older than 6 months)
  DELETE FROM payments 
  WHERE status = 'failed' 
  AND created_at < CURRENT_DATE - INTERVAL '6 months';
  
  -- Clean up expired promo codes
  UPDATE promo_codes 
  SET active = false 
  WHERE active = true 
  AND valid_to < CURRENT_DATE;
  
  -- Vacuum and analyze tables for better performance
  VACUUM ANALYZE cars;
  VACUUM ANALYZE bookings;
  VACUUM ANALYZE payments;
  VACUUM ANALYZE promo_codes;
END;
$$;

-- Create materialized view for popular cars (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_cars AS
SELECT 
  c.id,
  c.title,
  c.make,
  c.model,
  c.image_urls,
  c.price_per_day,
  c.location_city,
  COUNT(b.id) as booking_count,
  AVG(rating.value) as average_rating
FROM cars c
LEFT JOIN bookings b ON c.id = b.car_id AND b.status = 'confirmed'
LEFT JOIN (
  -- Assuming we have a ratings table (placeholder for future feature)
  SELECT car_id, 4.5 as value FROM cars LIMIT 0
) rating ON c.id = rating.car_id
WHERE c.status = 'active'
GROUP BY c.id, c.title, c.make, c.model, c.image_urls, c.price_per_day, c.location_city
ORDER BY booking_count DESC, average_rating DESC NULLS LAST;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_popular_cars_id ON mv_popular_cars(id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_cars;
END;
$$;

-- Create extension for better text search (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for trigram search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_trigram_search 
ON cars USING gin((title || ' ' || make || ' ' || model) gin_trgm_ops);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id SERIAL PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
  query_name TEXT,
  execution_time_ms NUMERIC,
  metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log queries slower than 1 second
  IF execution_time_ms > 1000 THEN
    INSERT INTO query_performance_log (query_name, execution_time_ms, metadata)
    VALUES (query_name, execution_time_ms, metadata);
  END IF;
END;
$$;

-- Clean up old performance logs (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_performance_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM query_performance_log 
  WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_cars(TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_materialized_views() TO authenticated;
GRANT SELECT ON mv_popular_cars TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_dashboard_stats() IS 'Optimized function to get dashboard statistics in a single query';
COMMENT ON FUNCTION search_cars(TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS 'Full-text search function for cars with filters and pagination';
COMMENT ON FUNCTION get_analytics_data(INTEGER) IS 'Comprehensive analytics data for the specified period';
COMMENT ON MATERIALIZED VIEW mv_popular_cars IS 'Materialized view of popular cars, refreshed daily';