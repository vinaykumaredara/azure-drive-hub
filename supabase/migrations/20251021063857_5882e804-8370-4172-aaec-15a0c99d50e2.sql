-- Security Fix: Remove privilege escalation vulnerability and create idempotency table
-- Part 1: Drop/update policies that depend on is_admin column

-- Drop the policy that depends on is_admin
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;

-- Recreate the policy WITHOUT is_admin dependency
CREATE POLICY "users_update_authenticated"
ON public.users
FOR UPDATE
USING (
  (auth.role() = 'authenticated'::text) AND 
  ((auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Now drop the dangerous is_admin column
ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;

-- 2. Create idempotency_keys table with proper RLS
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on idempotency_keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own idempotency records
CREATE POLICY "Users can view own idempotency keys"
  ON public.idempotency_keys
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage all records (for edge functions)
CREATE POLICY "Service role manages all idempotency keys"
  ON public.idempotency_keys
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create index for efficient expiration cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_expires 
  ON public.idempotency_keys(expires_at);

-- Create cleanup function for expired idempotency records
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < now();
END;
$$;