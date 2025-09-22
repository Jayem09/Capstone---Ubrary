-- =====================================================
-- DEBUG FRONTEND ISSUE - Run in Supabase SQL Editor
-- Let's test exactly what the frontend should be receiving
-- =====================================================

-- Step 1: Get Dr. Maria Santos' exact user ID that the frontend is using
SELECT 
    'Current user info (should match frontend):' as info,
    id,
    email,
    first_name || ' ' || last_name as name,
    role
FROM users 
WHERE role = 'faculty' 
ORDER BY created_at DESC 
LIMIT 1;

-- Step 2: Test the function with the exact parameters the frontend uses
-- The frontend calls: WorkflowService.getDocumentsByWorkflowStatus(user.id, statusFilter, 50, 0)
WITH faculty_user AS (
    SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1
)
SELECT 
    'Frontend function call simulation:' as test_type,
    f.id as user_id_being_used
FROM faculty_user f;

-- Step 3: Test the RPC call exactly as the frontend makes it
SELECT 
    'RPC call result (what frontend should see):' as info,
    *
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1),
    NULL,  -- statusFilter = undefined becomes NULL
    50,    -- limit
    0      -- offset
);

-- Step 4: Test with different parameter combinations that frontend might use
-- Test with 'all' status filter
SELECT 
    'Test with all status:' as info,
    COUNT(*) as count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1),
    'all',
    50,
    0
);

-- Test with undefined (NULL) status filter
SELECT 
    'Test with NULL status:' as info,
    COUNT(*) as count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1),
    NULL,
    50,
    0
);

-- Step 5: Check if there are multiple faculty users (potential ID mismatch)
SELECT 
    'All faculty users:' as info,
    id,
    email,
    first_name || ' ' || last_name as name,
    role,
    created_at
FROM users 
WHERE role = 'faculty' 
ORDER BY created_at DESC;

-- Step 6: Test the exact JSON structure that PostgREST returns
SELECT json_agg(
    json_build_object(
        'id', id,
        'title', title,
        'abstract', abstract,
        'program', program,
        'year', year,
        'status', status,
        'user_id', user_id,
        'adviser_id', adviser_id,
        'author_names', author_names,
        'adviser_name', adviser_name,
        'pages', pages,
        'file_size', file_size,
        'download_count', download_count,
        'view_count', view_count,
        'created_at', created_at,
        'updated_at', updated_at,
        'published_at', published_at,
        'workflow_position', workflow_position
    )
) as json_result
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1),
    NULL,
    50,
    0
);

-- Step 7: Check if the workflow statistics function also works
WITH faculty_user AS (
    SELECT id FROM users WHERE role = 'faculty' ORDER BY created_at DESC LIMIT 1
)
SELECT 
    'Workflow statistics test:' as info,
    (SELECT COUNT(*) FROM documents WHERE adviser_id = f.id AND status = 'pending') as pending_count,
    (SELECT COUNT(*) FROM documents WHERE adviser_id = f.id AND status = 'under_review') as under_review_count,
    (SELECT COUNT(*) FROM documents WHERE adviser_id = f.id AND status = 'needs_revision') as needs_revision_count,
    (SELECT COUNT(*) FROM documents WHERE adviser_id = f.id AND status = 'approved') as approved_count
FROM faculty_user f;
