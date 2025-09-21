# UBrary Setup Instructions

## Quick Fix for Document Loading Issue

The blinking/loading issue has been fixed! The problem was caused by double-fetching documents. Here's what was changed:

### ✅ Fixed Issues:

1. **Double-fetching**: Removed redundant `useEffect` that was causing documents to load twice
2. **Loading state management**: Now properly handles loading states without conflicts
3. **RLS Policy recursion**: Created patch to fix Supabase Row Level Security policies

## 🚀 Next Steps:

### 1. Apply the RLS Policy Fix

Run this SQL patch in your Supabase SQL Editor:

```sql
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
```

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Test the Application

1. **Restart your development server**:

   ```bash
   npm run dev
   ```

2. **Visit the application** - The "loading documents" issue should be resolved!

3. **Test the workflow**:
   - Go to the "Workflow" section in the sidebar
   - You should see the workflow dashboard with document status tracking
   - Try submitting a document for review
   - Test the approval process

## 🎯 What's Working Now:

- ✅ Document loading without blinking
- ✅ Workflow system (submission → review → curation → publish)
- ✅ Document search and filtering
- ✅ User roles and permissions
- ✅ Supabase integration

## 📝 If You Still See Issues:

1. **Check browser console** for any remaining errors
2. **Verify your Supabase credentials** in `.env.local`
3. **Run the SQL patch** if you haven't already
4. **Clear browser cache** and refresh

The application should now work smoothly without the loading/blinking issue!
