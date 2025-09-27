-- Add license storage metadata to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_path text,         -- storage path for license
  ADD COLUMN IF NOT EXISTS license_verified boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.users.license_path IS 'Storage path for user driver license document';
COMMENT ON COLUMN public.users.license_verified IS 'Whether admin has verified the license';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_license_verified ON public.users (license_verified);