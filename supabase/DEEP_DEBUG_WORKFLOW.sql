-- =====================================================
-- DEEP DEBUG WORKFLOW - Run in Supabase SQL Editor
-- Let's trace exactly why the function returns 0 documents
-- =====================================================

-- Step 1: Verify the frontend user exists and has the right role
SELECT 
    'Frontend user details:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role,
    created_at
FROM users 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 2: Check if documents are properly assigned to this user
SELECT 
    'Documents assigned to frontend user:' as info,
    id,
    title,
    status,
    user_id,
    adviser_id,
    author_names,
    adviser_name
FROM documents 
WHERE adviser_id = '550e8400-e29b-41d4-a716-446655440002'
   OR user_id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 3: Check all workflow documents regardless of user
SELECT 
    'All workflow documents:' as info,
    id,
    title,
    status::TEXT as status,
    user_id,
    adviser_id,
    author_names,
    adviser_name
FROM documents 
WHERE status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
ORDER BY updated_at DESC;

-- Step 4: Test the function step by step - break down the WHERE conditions
-- Test condition 1: Status filter
WITH frontend_user AS (
    SELECT '550e8400-e29b-41d4-a716-446655440002'::UUID as id
)
SELECT 
    'Documents matching status filter:' as info,
    COUNT(*) as count
FROM documents d, frontend_user f
WHERE 
    (NULL IS NULL OR d.status::TEXT = NULL) AND
    (
        NULL = 'published' OR 
        d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    );

-- Test condition 2: Role-based access
WITH frontend_user AS (
    SELECT '550e8400-e29b-41d4-a716-446655440002'::UUID as id
)
SELECT 
    'Documents matching access control:' as info,
    COUNT(*) as count,
    array_agg(
        CASE 
            WHEN d.user_id = f.id THEN 'own_document'
            WHEN d.adviser_id = f.id THEN 'advising'
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = f.id AND u.role IN ('librarian', 'admin')) THEN 'admin_access'
            ELSE 'no_access'
        END
    ) as access_types
FROM documents d, frontend_user f
WHERE 
    d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    AND (
        d.user_id = f.id OR
        d.adviser_id = f.id OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = f.id AND u.role IN ('librarian', 'admin')
        )
    );

-- Step 5: Check if the user has the right role for admin access
SELECT 
    'User role check for admin access:' as info,
    role,
    CASE 
        WHEN role IN ('librarian', 'admin') THEN 'Has admin access'
        WHEN role = 'faculty' THEN 'Faculty - needs adviser assignment'
        WHEN role = 'student' THEN 'Student - needs own documents'
        ELSE 'Unknown role'
    END as access_level
FROM users 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 6: Manual query with explicit conditions
SELECT 
    'Manual query with frontend user:' as info,
    d.id,
    d.title,
    d.status::TEXT as status,
    d.user_id,
    d.adviser_id,
    CASE 
        WHEN d.user_id = '550e8400-e29b-41d4-a716-446655440002' THEN 'user_match'
        WHEN d.adviser_id = '550e8400-e29b-41d4-a716-446655440002' THEN 'adviser_match'
        ELSE 'no_match'
    END as match_type
FROM documents d
WHERE 
    d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    AND (
        d.user_id = '550e8400-e29b-41d4-a716-446655440002' OR
        d.adviser_id = '550e8400-e29b-41d4-a716-446655440002'
    );

-- Step 7: Check if the issue is with the function itself
-- Let's create a simple test function
CREATE OR REPLACE FUNCTION debug_workflow_function(
    test_user_id UUID
)
RETURNS TABLE (
    doc_id UUID,
    doc_title TEXT,
    doc_status TEXT,
    match_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as doc_id,
        d.title as doc_title,
        d.status::TEXT as doc_status,
        CASE 
            WHEN d.user_id = test_user_id THEN 'user_owns_document'
            WHEN d.adviser_id = test_user_id THEN 'user_advises_document'
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = test_user_id AND u.role IN ('librarian', 'admin')) THEN 'admin_access'
            ELSE 'no_access'
        END as match_reason
    FROM documents d
    WHERE 
        d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
        AND (
            d.user_id = test_user_id OR
            d.adviser_id = test_user_id OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = test_user_id AND u.role IN ('librarian', 'admin')
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Test the debug function
SELECT 
    'Debug function results:' as info,
    *
FROM debug_workflow_function('550e8400-e29b-41d4-a716-446655440002'::UUID);

-- Step 8: Final verification - check if ANY documents exist for ANY user
SELECT 
    'Documents that should be accessible to ANY faculty:' as info,
    d.id,
    d.title,
    d.status,
    d.adviser_id,
    u.first_name || ' ' || u.last_name as adviser_name
FROM documents d
LEFT JOIN users u ON d.adviser_id = u.id
WHERE d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
ORDER BY d.updated_at DESC;
