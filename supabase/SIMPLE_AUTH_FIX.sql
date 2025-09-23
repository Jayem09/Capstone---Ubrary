-- SIMPLE AUTH FIX - Copy and paste this into Supabase SQL Editor
-- This creates the missing trigger for user registration

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, first_name, last_name, role, program, department, 
    student_id, employee_id, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    NEW.raw_user_meta_data->>'program',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'employee_id',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;

-- Success message
SELECT 'Auth fix applied! Registration should work now.' as result;
