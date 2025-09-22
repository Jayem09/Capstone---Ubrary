-- Debug the starred_documents issue

-- Check if the table actually exists and is accessible
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'starred_documents';

-- Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'starred_documents'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'starred_documents';

-- Try a simple select to see if it works
SELECT COUNT(*) as record_count FROM starred_documents;

-- Check if PostgREST can see the table
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'starred_documents';

-- Show all current policies (should be none since we disabled RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'starred_documents';

-- Force another schema reload
NOTIFY pgrst, 'reload schema';

SELECT 'Debug information collected!' as status;
