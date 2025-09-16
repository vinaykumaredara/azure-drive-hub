-- Migration for PR 4: System Settings
-- Create system_settings table and RLS policies

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for system_settings (admin only for modifications, public for reads)
CREATE POLICY "system_settings_admin_modify" ON public.system_settings
  FOR ALL USING (public.is_admin());

CREATE POLICY "system_settings_public_read" ON public.system_settings
  FOR SELECT USING (TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- Insert default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('site_name', '"RP Cars"'),
  ('site_description', '"Premium car rental service in India"'),
  ('contact_email', '"support@rpcars.in"'),
  ('contact_phone', '"+91 9876543210"'),
  ('maintenance_mode', 'false'),
  ('max_booking_days', '30'),
  ('default_service_charge', '500')
ON CONFLICT (key) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.system_settings IS 'System configuration settings';
COMMENT ON COLUMN public.system_settings.key IS 'Setting key';
COMMENT ON COLUMN public.system_settings.value IS 'Setting value as JSONB';
COMMENT ON COLUMN public.system_settings.updated_at IS 'Last update timestamp';