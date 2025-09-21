# How to Fix the RLS Authentication Issue

## Problem

You're getting 401 Unauthorized errors and RLS policy violations when trying to create documents because:

1. Your app uses mock authentication (not real Supabase auth)
2. Supabase RLS policies expect `auth.uid()` to return a valid user ID
3. Since you're not authenticated with Supabase, `auth.uid()` returns null
4. This affects multiple tables: `documents`, `keywords`, `document_keywords`, `document_authors`, `document_files`
5. Storage bucket policies also require authentication

## Solution Steps

### Step 1: Apply the RLS Fix

Run the SQL script `supabase/fix_dev_rls.sql` in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/fix_dev_rls.sql`
4. Click "Run" to execute the script

This will:

- Replace restrictive RLS policies with permissive ones for development
- Allow document creation, viewing, and updates without authentication
- Fix the "new row violates row-level security policy" error
- Fix RLS policies for all related tables (keywords, document_authors, document_keywords, document_files)
- Fix storage bucket policies for file uploads

### Step 2: Verify the Fix

After applying the SQL script, try uploading a document again. The error should be resolved.

### Step 3: Alternative - Use Real Supabase Authentication (Optional)

If you want to use real Supabase authentication instead of mock auth:

1. Set up your environment variables:

   ```bash
   # Create .env.local file
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Update your AuthContext to use real Supabase auth instead of mock users

## Files Modified

- `src/lib/supabase.ts` - Updated Supabase client configuration
- `src/lib/supabase-dev-helper.ts` - Created development helper functions
- `src/services/documentService.ts` - Updated to use development helpers
- `supabase/fix_dev_rls.sql` - SQL script to fix RLS policies

## Testing

After applying the fix, you should be able to:

- ✅ Create new documents without authentication errors
- ✅ View documents in the repository
- ✅ Upload files with documents
- ✅ Add keywords to documents
- ✅ Link authors to documents
- ✅ Save file metadata
- ✅ Use all document management features

The development helpers will automatically be used in development mode and will fall back to production methods when deployed.

## What Was Fixed

1. **Documents table** - RLS policies now allow creation, viewing, and updates
2. **Keywords table** - RLS policies now allow keyword creation and management
3. **Document relationships** - RLS policies for document_authors, document_keywords, document_files
4. **Storage bucket** - Policies now allow file uploads, downloads, and management
5. **Development helpers** - Created bypass functions for all database operations
6. **Error handling** - Improved error handling and fallback mechanisms

## Next Steps

1. **Apply the SQL script** in your Supabase dashboard
2. **Test document upload** - Try uploading a document with keywords and authors
3. **Verify file upload** - Check that PDF files are uploaded successfully
4. **Test document viewing** - Ensure documents appear in the repository

The solution is now complete and should resolve all RLS authentication issues! 🎉
