-- =====================================================
-- FINAL WORKFLOW FIX - Run in Supabase SQL Editor
-- This fixes the workflow dashboard showing 0 documents
-- =====================================================

-- Step 1: Verify current state
SELECT 'Current state check:' as info;

-- Check faculty user
SELECT 
    'Faculty user:' as type,
    id,
    first_name || ' ' || last_name as name,
    email,
    role
FROM users 
WHERE role = 'faculty' 
LIMIT 1;

-- Check documents accessible to faculty
WITH faculty_user AS (
    SELECT id FROM users WHERE role = 'faculty' LIMIT 1
)
SELECT 
    'Documents accessible to faculty:' as type,
    d.id,
    d.title,
    d.status,
    d.adviser_id,
    d.adviser_name,
    CASE 
        WHEN d.user_id = f.id THEN 'own_document'
        WHEN d.adviser_id = f.id THEN 'advising'
        ELSE 'admin_access'
    END as access_reason
FROM documents d, faculty_user f
WHERE 
    d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    AND (
        d.user_id = f.id OR           -- Student's own documents
        d.adviser_id = f.id OR        -- Documents they advise
        EXISTS (                      -- Admin/librarian access
            SELECT 1 FROM users u
            WHERE u.id = f.id AND u.role IN ('librarian', 'admin')
        )
    )
ORDER BY d.updated_at DESC;

-- Step 2: Test the workflow function directly
SELECT 
    'Testing workflow function:' as type,
    *
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    50,
    0
);

-- Step 3: If function returns no results, there might be an issue with the function
-- Let's create a simple test version
CREATE OR REPLACE FUNCTION test_workflow_function(
    user_id_param UUID
)
RETURNS TABLE (
    doc_id UUID,
    doc_title TEXT,
    doc_status TEXT,
    access_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as doc_id,
        d.title as doc_title,
        d.status::TEXT as doc_status,
        CASE 
            WHEN d.user_id = user_id_param THEN 'own_document'
            WHEN d.adviser_id = user_id_param THEN 'advising'
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = user_id_param AND u.role IN ('librarian', 'admin')) THEN 'admin_access'
            ELSE 'no_access'
        END as access_reason
    FROM documents d
    WHERE 
        d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
        AND (
            d.user_id = user_id_param OR
            d.adviser_id = user_id_param OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = user_id_param AND u.role IN ('librarian', 'admin')
            )
        )
    ORDER BY d.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the simple function
SELECT 
    'Testing simple function:' as type,
    *
FROM test_workflow_function(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1)
);

-- Step 4: Check if there's a caching issue by refreshing schema
NOTIFY pgrst, 'reload schema';

-- Step 5: Ensure proper permissions
GRANT EXECUTE ON FUNCTION test_workflow_function TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status TO authenticated;

-- Step 6: Final test
SELECT 
    'Final function test:' as type,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    50,
    0
);

SELECT '🎯 If this shows documents, the workflow dashboard should now work!' as success_message;
