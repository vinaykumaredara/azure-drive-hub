-- Force a schema refresh by sending a notification to PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- If that doesn't work, we can also try to restart the PostgREST service
-- This would normally be done through the Supabase dashboard, but we can
-- trigger it by making a change that requires a restart

-- Add a comment to the cars table to trigger a DDL event
COMMENT ON TABLE public.cars IS 'Cars available for rental - Updated schema';

-- Force refresh again
SELECT pg_notify('pgrst', 'reload schema');