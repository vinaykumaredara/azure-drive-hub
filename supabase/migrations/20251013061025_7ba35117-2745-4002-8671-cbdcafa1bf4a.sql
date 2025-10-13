-- Fix pgrst_reload_on_ddl function to set search_path
CREATE OR REPLACE FUNCTION public.pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;