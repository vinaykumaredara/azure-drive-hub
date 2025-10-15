-- Fix 1: Improve handle_new_user trigger to properly handle Google OAuth metadata
-- Google OAuth stores the name in raw_user_meta_data->>'name' OR ->>'full_name'
-- Also add better error handling and logging

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Critical: Bypass RLS to ensure user creation
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user_id: %, email: %, provider: %', 
    NEW.id, NEW.email, NEW.raw_user_meta_data->>'provider';
  
  -- Extract full name from Google OAuth metadata
  -- Google can store it as 'name', 'full_name', or in a 'user_metadata' object
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',  -- Email/password signup
    NEW.raw_user_meta_data->>'name',       -- Google OAuth
    NEW.raw_user_meta_data->'user_metadata'->>'full_name',  -- Alternative structure
    NEW.email  -- Fallback to email
  );
  
  RAISE LOG 'Extracted full_name: % for user: %', user_full_name, NEW.id;
  
  -- Insert into public.users table
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, user_full_name)
  ON CONFLICT (id) DO UPDATE 
    SET full_name = COALESCE(EXCLUDED.full_name, users.full_name);
  
  RAISE LOG 'Successfully inserted user into public.users: %', NEW.id;
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE LOG 'Successfully created user_role for user: %', NEW.id;
  
  -- Check for admin email and grant admin role
  IF NEW.email = 'rpcars2025@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE LOG 'Granted admin role to user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth operation
    RAISE LOG 'ERROR in handle_new_user for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise to fail the trigger if critical
    RAISE;
END;
$$;

-- Ensure the trigger exists and is configured correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Verify RLS policies allow trigger to insert
-- The trigger uses SECURITY DEFINER so it should bypass RLS, but let's ensure policies are correct

-- Add a policy to allow the trigger to insert (belt and suspenders approach)
DROP POLICY IF EXISTS "Allow trigger to insert users" ON public.users;
CREATE POLICY "Allow trigger to insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);  -- Allow trigger to insert any user

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger function to create user profile and roles when a new auth.user is created. 
   Handles both email/password and OAuth (Google) signup flows. 
   Uses SECURITY DEFINER to bypass RLS.';
