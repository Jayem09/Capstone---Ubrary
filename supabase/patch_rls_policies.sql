-- Idempotent patch to fix enum types and recursive RLS policies

-- 1) Ensure enum types exist, and add missing values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'librarian', 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'published');
  END IF;
END
$$;

-- Add workflow states if they don't exist yet
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'needs_revision';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'curation';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'ready_for_publication';

-- 2) Fix recursive RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop policies that reference the users table inside a users policy (causes recursion)
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Keep self-profile view/edit policies (safe)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Add a permissive read policy to enable document joins to adviser/authors without recursion
-- If you prefer stricter access, switch USING (true) to USING (auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Public can view basic user info" ON users;
CREATE POLICY "Public can view basic user info" ON users
  FOR SELECT USING (true);

-- 3) Optional: ensure documents are selectable for published status and owners/advisers
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published documents are viewable by all authenticated users" ON documents;
CREATE POLICY "Published documents are viewable by all authenticated users" ON documents
  FOR SELECT USING (status = 'published' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Advisers can view their advisees' documents" ON documents;
CREATE POLICY "Advisers can view their advisees' documents" ON documents
  FOR SELECT USING (auth.uid() = adviser_id);

-- 4) Leave other table policies as-is; they can SELECT from users now without recursion due to the permissive users policy

-- After running this script, retry your document query.

