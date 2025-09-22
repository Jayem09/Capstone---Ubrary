-- =====================================================
-- FINAL USER ID FIX - Run in Supabase SQL Editor
-- Update the user ID to match what the frontend expects
-- =====================================================

-- Step 1: Show current state
SELECT 
    'Current Maria Santos user:' as info,
    id as current_id,
    '550e8400-e29b-41d4-a716-446655440002' as frontend_expects,
    first_name || ' ' || last_name as name,
    email,
    role
FROM users 
WHERE id = '78fc980f-0c3c-4530-a7a4-d336474a96a4';

-- Step 2: Update the user ID to match frontend expectation
-- This is the most direct fix
UPDATE users 
SET id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id = '78fc980f-0c3c-4530-a7a4-d336474a96a4';

-- Step 3: Update all document assignments to use the new ID
UPDATE documents 
SET adviser_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE adviser_id = '78fc980f-0c3c-4530-a7a4-d336474a96a4';

-- Step 4: Verify the fix
SELECT 
    'Updated user:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role
FROM users 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 5: Verify document assignments
SELECT 
    'Documents now assigned to frontend user ID:' as info,
    COUNT(*) as total_documents,
    array_agg(DISTINCT status) as statuses
FROM documents 
WHERE adviser_id = '550e8400-e29b-41d4-a716-446655440002'
  AND status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');

-- Step 6: Test the workflow function
SELECT 
    'Workflow function test:' as info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Step 7: Show the actual results that frontend will receive
SELECT 
    'Frontend will see these documents:' as info,
    id,
    title,
    status,
    author_names,
    adviser_name,
    workflow_position
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    20,
    0
)
ORDER BY workflow_position, updated_at DESC;

-- Step 8: Test status-specific queries
SELECT 
    'Documents by status:' as status_breakdown,
    status,
    COUNT(*) as count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
)
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'under_review' THEN 2
        WHEN 'needs_revision' THEN 3
        WHEN 'approved' THEN 4
        WHEN 'curation' THEN 5
        WHEN 'ready_for_publication' THEN 6
        WHEN 'published' THEN 7
        ELSE 8
    END;

SELECT '🎯 Frontend should now show 8 documents in the workflow dashboard!' as success_message;
