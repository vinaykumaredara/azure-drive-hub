-- Auto-reload PostgREST after DDL changes
-- This migration creates an event trigger to automatically notify PostgREST to reload schema cache

-- Create the function that notifies PostgREST
CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify PostgREST to reload schema
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- Create the event trigger that fires on DDL command end
DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;
CREATE EVENT TRIGGER pgrst_reload_on_ddl
ON ddl_command_end
EXECUTE FUNCTION pgrst_reload_on_ddl();

-- Add a comment for documentation
COMMENT ON FUNCTION pgrst_reload_on_ddl() IS 'Automatically reloads PostgREST schema cache after DDL changes';