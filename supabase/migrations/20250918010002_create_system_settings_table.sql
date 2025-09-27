-- Create system_settings table for admin configuration
-- This table will be used by the System Settings admin page

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for admins to manage system settings
DROP POLICY IF EXISTS "admins_manage_system_settings" ON public.system_settings;
CREATE POLICY "admins_manage_system_settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Grant necessary permissions
GRANT ALL ON public.system_settings TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.system_settings IS 'System configuration settings managed by admins';
COMMENT ON COLUMN public.system_settings.key IS 'Unique key for the setting';
COMMENT ON COLUMN public.system_settings.value IS 'JSONB value for the setting';
COMMENT ON COLUMN public.system_settings.updated_at IS 'Timestamp when the setting was last updated';