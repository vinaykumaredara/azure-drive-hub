-- Critical Security Fix: Replace is_admin() with has_role() in RLS policies
-- This migration fixes privilege escalation vulnerabilities

-- 1. Update is_admin() function to use user_roles table instead of users.is_admin column
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 2. Fix complaints table RLS policy
DROP POLICY IF EXISTS "complaints_owner_admin" ON public.complaints;
CREATE POLICY "complaints_owner_admin" 
ON public.complaints
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid()));

-- 3. Fix maintenance table RLS policy
DROP POLICY IF EXISTS "maintenance_admin_only" ON public.maintenance;
CREATE POLICY "maintenance_admin_only" 
ON public.maintenance
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix promo_codes table RLS policies
DROP POLICY IF EXISTS "promo_codes_admin_select" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_modify_admin" ON public.promo_codes;

CREATE POLICY "promo_codes_admin_select" 
ON public.promo_codes
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "promo_codes_modify_admin" 
ON public.promo_codes
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add explicit authentication requirements for public-readable tables
DROP POLICY IF EXISTS "maintenance_select_admin" ON public.maintenance;
CREATE POLICY "maintenance_select_admin" 
ON public.maintenance
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "audit_logs_select_authenticated_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_authenticated_only" 
ON public.audit_logs
FOR SELECT 
USING (
  (auth.role() = 'authenticated'::text) AND 
  ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "promo_codes_select_admin_only" ON public.promo_codes;
CREATE POLICY "promo_codes_select_admin_only" 
ON public.promo_codes
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Restrict users table UPDATE policy to prevent is_admin column modification
-- Users can only update their own profile fields, not is_admin
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
CREATE POLICY "users_update_authenticated" 
ON public.users
FOR UPDATE 
USING (
  (auth.role() = 'authenticated'::text) AND 
  (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  (auth.role() = 'authenticated'::text) AND 
  (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role)) AND
  -- Prevent non-admins from setting is_admin to true
  (CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE (is_admin IS NULL OR is_admin = false OR is_admin = (SELECT is_admin FROM users WHERE id = auth.uid()))
  END)
);

-- 7. Add audit logging for security-sensitive operations
INSERT INTO public.audit_logs (action, description, user_id, metadata)
VALUES (
  'security_migration',
  'Applied RLS policy security fixes - migrated from is_admin column to user_roles table',
  auth.uid(),
  jsonb_build_object(
    'migration_date', NOW(),
    'policies_updated', ARRAY['complaints', 'maintenance', 'promo_codes', 'users', 'audit_logs']
  )
);

-- 8. Add comments for documentation
COMMENT ON FUNCTION public.is_admin() IS 
'DEPRECATED: Use has_role(auth.uid(), ''admin''::app_role) directly instead. This function now wraps has_role() for backward compatibility.';

COMMENT ON COLUMN public.users.is_admin IS 
'DEPRECATED: Admin status is now managed via user_roles table. This column is kept for backward compatibility but protected by RLS policy to prevent unauthorized modification.';