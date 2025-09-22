# Fix for Starred Documents 406 (Not Acceptable) Errors

## Problem

You're seeing 406 (Not Acceptable) errors when trying to access starred documents:

```
GET https://wzuktpxpmlctomuqktdm.supabase.co/rest/v1/starred_documents?select=id&document_id=eq.xxx&user_id=eq.xxx 406 (Not Acceptable)
```

This indicates that the `starred_documents` table either doesn't exist or has RLS (Row Level Security) policy issues.

## Solution

### Option 1: Quick Fix (Recommended for Development)

Run this SQL in your Supabase SQL Editor:

```sql
-- Run the temporary fix
\i supabase/temp_fix_starred.sql
```

Or copy and paste the contents of `supabase/temp_fix_starred.sql` directly into your Supabase SQL Editor.

### Option 2: Proper RLS Fix

If you want to keep RLS enabled, run this instead:

```sql
-- Run the RLS fix
\i supabase/fix_starred_rls.sql
```

### Option 3: Complete Database Setup

If you haven't run the complete database setup yet:

```sql
-- Run the complete setup
\i supabase/complete_database_setup.sql
```

## What This Fixes

1. **Creates the starred_documents table** if it doesn't exist
2. **Fixes RLS policies** that were causing 406 errors
3. **Adds proper indexes** for performance
4. **Creates the toggle_document_star function** for starring/unstarring
5. **Grants proper permissions** to authenticated users

## Code Changes Made

The following files have been updated to handle 406 errors gracefully:

- `src/services/starredService.ts` - Added error handling for 406 status codes
- Added SQL fix scripts in `supabase/` directory

## After Running the Fix

1. The 406 errors should stop appearing in your browser console
2. Starred documents functionality should work properly
3. Users can star/unstar documents
4. The starred count in the sidebar should work

## Verification

After running the fix, you can verify it worked by:

1. Refreshing your browser
2. Trying to star/unstar a document
3. Checking that no 406 errors appear in the console
4. Verifying the starred count updates in the sidebar

If you still see issues, check your browser's Network tab to see the exact error response from Supabase.
