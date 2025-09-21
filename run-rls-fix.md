# Quick Fix Instructions

## The Error You Got

```
ERROR: 42710: policy "Dev: Allow document creation" for table "documents" already exists
```

## Solution

The SQL script has been updated to handle existing policies. Now you can run it safely:

### Step 1: Copy the Updated Script

The file `supabase/fix_dev_rls.sql` now includes `DROP POLICY IF EXISTS` statements before creating new policies, so it won't fail if policies already exist.

### Step 2: Run the Script

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the **entire contents** of `supabase/fix_dev_rls.sql`
4. Paste and run it

### Step 3: Test

Try uploading a document again - all errors should be resolved!

## What the Script Does Now

- ✅ Safely drops existing policies before creating new ones
- ✅ Fixes RLS for all tables: documents, keywords, document_authors, document_keywords, document_files
- ✅ Fixes storage bucket policies
- ✅ Creates permissive development policies
- ✅ Won't fail if run multiple times

The script is now **idempotent** - you can run it as many times as needed without errors! 🎉
