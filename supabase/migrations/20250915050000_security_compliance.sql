-- Migration for PR 5: Security & Compliance
-- Create audit_logs table and RLS policies

-- Create audit_logs table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit log for admin actions';
COMMENT ON COLUMN public.audit_logs.id IS 'Unique identifier';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (e.g., login, car_create, user_suspend)';
COMMENT ON COLUMN public.audit_logs.description IS 'Description of the action';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional metadata as JSONB';
COMMENT ON COLUMN public.audit_logs.timestamp IS 'Timestamp of the action';