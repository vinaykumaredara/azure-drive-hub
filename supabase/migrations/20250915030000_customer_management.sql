-- Migration for PR 3: Customer Management
-- Add columns for customer suspension and audit logging

-- Add suspension columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_suspended ON public.users(is_suspended);
CREATE INDEX IF NOT EXISTS idx_users_suspended_at ON public.users(suspended_at);

-- Comments for documentation
COMMENT ON COLUMN public.users.is_suspended IS 'Whether the user account is suspended';
COMMENT ON COLUMN public.users.suspension_reason IS 'Reason for account suspension';
COMMENT ON COLUMN public.users.suspended_at IS 'Timestamp when account was suspended';
COMMENT ON COLUMN public.users.suspended_by IS 'Admin who suspended the account';