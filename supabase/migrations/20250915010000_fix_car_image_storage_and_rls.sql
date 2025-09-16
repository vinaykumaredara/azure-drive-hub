-- Migration to fix car image storage and RLS policies
-- This migration ensures proper image handling and access control

-- Ensure cars table has the correct structure
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS price_in_paise BIGINT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update RLS policies to restrict public access to only published cars
DROP POLICY IF EXISTS "cars_select_public" ON public.cars;
CREATE POLICY "cars_select_public" ON public.cars
  FOR SELECT USING (status = 'published');

-- Ensure admins can insert/update cars
DROP POLICY IF EXISTS "cars_modify_admin" ON public.cars;
CREATE POLICY "cars_modify_admin" ON public.cars
  FOR ALL USING (public.is_admin());

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.users(id),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit_logs (admin only)
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR ALL USING (public.is_admin());

-- Create system_settings table if it doesn't exist
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

-- Comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit log for admin actions';
COMMENT ON TABLE public.system_settings IS 'System configuration settings';
COMMENT ON COLUMN public.cars.price_in_paise IS 'Price stored in paise (smallest currency unit) for Indian Rupee';
COMMENT ON COLUMN public.cars.currency IS 'Currency code (ISO 4217), default INR for Indian Rupee';