-- Fix RLS policies for cars table to properly restrict UPDATE and DELETE operations
-- This migration ensures that only admins can modify cars

-- Drop existing policies
DROP POLICY IF EXISTS "public_select_published" ON public.cars;
DROP POLICY IF EXISTS "admins_modify_cars" ON public.cars;

-- Create policy for public users to select published cars
CREATE POLICY "public_select_published" ON public.cars
  FOR SELECT USING (status = 'published');

-- Create policy for admins to insert cars
CREATE POLICY "admins_insert_cars" ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Create policy for admins to update cars
CREATE POLICY "admins_update_cars" ON public.cars
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Create policy for admins to delete cars
CREATE POLICY "admins_delete_cars" ON public.cars
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Ensure RLS is enabled on the cars table
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.cars TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "public_select_published" ON public.cars IS 'Public users can only select published cars';
COMMENT ON POLICY "admins_insert_cars" ON public.cars IS 'Only admin users can insert cars';
COMMENT ON POLICY "admins_update_cars" ON public.cars IS 'Only admin users can update cars';
COMMENT ON POLICY "admins_delete_cars" ON public.cars IS 'Only admin users can delete cars';