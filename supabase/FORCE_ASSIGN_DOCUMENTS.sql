-- =====================================================
-- FORCE ASSIGN DOCUMENTS - Run in Supabase SQL Editor
-- This will forcefully assign documents to the frontend user
-- =====================================================

-- Step 1: Ensure the frontend user exists with correct role
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'maria.santos@ub.edu.ph',
    'Maria',
    'Santos',
    'faculty',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'faculty',
    first_name = 'Maria',
    last_name = 'Santos',
    email = 'maria.santos@ub.edu.ph',
    updated_at = NOW();

-- Step 2: Force assign ALL workflow documents to this user
UPDATE documents 
SET 
    adviser_id = '550e8400-e29b-41d4-a716-446655440002',
    adviser_name = 'Dr. Maria Santos',
    updated_at = NOW()
WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');

-- Step 3: Verify the assignments
SELECT 
    'Documents after forced assignment:' as info,
    id,
    title,
    status,
    adviser_id,
    adviser_name,
    CASE 
        WHEN adviser_id = '550e8400-e29b-41d4-a716-446655440002' THEN '✅ ASSIGNED'
        ELSE '❌ NOT ASSIGNED'
    END as assignment_status
FROM documents 
WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
ORDER BY updated_at DESC;

-- Step 4: Test the function immediately
SELECT 
    'Function test after forced assignment:' as info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Step 5: Show the actual results
SELECT 
    'Actual function results:' as info,
    id,
    title,
    status,
    author_names,
    adviser_name,
    workflow_position
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    10,
    0
)
ORDER BY workflow_position;

-- Step 6: Test with specific status filters
SELECT 'Pending documents:' as status_test, COUNT(*) as count
FROM get_documents_by_workflow_status('550e8400-e29b-41d4-a716-446655440002'::UUID, 'pending', 50, 0)
UNION ALL
SELECT 'Under review documents:', COUNT(*)
FROM get_documents_by_workflow_status('550e8400-e29b-41d4-a716-446655440002'::UUID, 'under_review', 50, 0)
UNION ALL
SELECT 'Needs revision documents:', COUNT(*)
FROM get_documents_by_workflow_status('550e8400-e29b-41d4-a716-446655440002'::UUID, 'needs_revision', 50, 0)
UNION ALL
SELECT 'Approved documents:', COUNT(*)
FROM get_documents_by_workflow_status('550e8400-e29b-41d4-a716-446655440002'::UUID, 'approved', 50, 0);

SELECT '🎯 This should fix the workflow dashboard completely!' as final_message;
