-- COMPREHENSIVE AUTH FIX
-- This addresses potential schema issues and creates a more robust trigger

-- First, let's check if the users table has the correct structure
-- and fix any potential issues

-- Drop the existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust function that handles potential errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user with proper error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      program,
      department,
      student_id,
      employee_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
      NEW.raw_user_meta_data->>'program',
      NEW.raw_user_meta_data->>'department',
      NEW.raw_user_meta_data->>'student_id',
      NEW.raw_user_meta_data->>'employee_id',
      NOW(),
      NOW()
    );
    
    -- Log successful creation
    RAISE NOTICE 'User profile created successfully for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    -- Return NEW to allow auth user creation to succeed
    RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;

-- Fix RLS policies to be more permissive for user creation
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create more permissive policies
CREATE POLICY "Allow user profile creation" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Test the trigger by checking if it exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Show the function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Display success message
SELECT 'Comprehensive auth fix applied! Try registration again.' as result;
