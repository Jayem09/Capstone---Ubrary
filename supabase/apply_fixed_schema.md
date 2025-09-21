# How to Apply the Fixed Schema to Supabase

The "infinite recursion detected in policy for relation 'users'" error is caused by circular references in the Row Level Security (RLS) policies. The fixed schema resolves this issue.

## Steps to Apply the Fix:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `fixed_schema.sql`**
4. **Run the SQL script**

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push
```

### Option 3: Manual Step-by-Step (If you want to preserve existing data)

1. **Drop problematic policies first:**

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Published documents are viewable by all authenticated users" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Advisers can view their advisees' documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own pending documents" ON documents;
DROP POLICY IF EXISTS "Advisers can update document status" ON documents;
```

2. **Apply the new policies from the fixed schema**

## Key Changes in the Fixed Schema:

1. **Simplified RLS Policies**: Removed circular references that caused infinite recursion
2. **Public Read Access**: Added public read access to basic user info for document display
3. **Direct UUID Comparisons**: Used direct UUID comparisons instead of string conversions
4. **Added Workflow Tables**: Included all the new workflow-related tables
5. **Enhanced Functions**: Added workflow statistics and management functions

## After Applying the Fix:

1. **Test document loading** - The error should be resolved
2. **Verify workflow functionality** - All workflow features should work
3. **Check user permissions** - Ensure users can still access their data appropriately

## Environment Variables:

Make sure you have your Supabase credentials in a `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The application will automatically use these credentials and show a configuration status in the browser console.
