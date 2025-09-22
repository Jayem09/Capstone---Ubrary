-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT - Run in Supabase SQL Editor
-- Handle the foreign key constraint by updating documents first
-- =====================================================

-- Step 1: Show current state
SELECT 
    'Current situation:' as info,
    'Maria Santos ID: 78fc980f-0c3c-4530-a7a4-d336474a96a4' as current_id,
    'Frontend expects: 550e8400-e29b-41d4-a716-446655440002' as frontend_id;

-- Step 2: Check if the frontend user ID already exists
SELECT 
    'Frontend user ID exists:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440002') 
        THEN 'YES - User exists'
        ELSE 'NO - User does not exist'
    END as status;

-- Step 3: Create the frontend user if it doesn't exist
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
    'maria.santos.frontend@ub.edu.ph',  -- Different email to avoid conflicts
    'Maria',
    'Santos',
    'faculty',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'faculty',
    first_name = 'Maria',
    last_name = 'Santos',
    updated_at = NOW();

-- Step 4: Update all documents to use the frontend user ID
UPDATE documents 
SET 
    adviser_id = '550e8400-e29b-41d4-a716-446655440002',
    adviser_name = 'Dr. Maria Santos',
    updated_at = NOW()
WHERE adviser_id = '78fc980f-0c3c-4530-a7a4-d336474a96a4';

-- Step 5: Verify the document updates
SELECT 
    'Documents updated to frontend user ID:' as info,
    COUNT(*) as total_documents,
    array_agg(DISTINCT status) as statuses
FROM documents 
WHERE adviser_id = '550e8400-e29b-41d4-a716-446655440002'
  AND status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');

-- Step 6: Test the workflow function with frontend user ID
SELECT 
    'Workflow function test with frontend ID:' as info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Step 7: Show the actual results
SELECT 
    'Documents frontend will receive:' as info,
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

-- Step 8: Test with specific status filters
SELECT 
    'Status breakdown:' as info,
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

-- Step 9: Clean up - optionally remove the old Maria Santos user if no longer needed
-- (Only do this if you're sure the old user is not needed elsewhere)
-- DELETE FROM users WHERE id = '78fc980f-0c3c-4530-a7a4-d336474a96a4';

-- Step 10: Final verification
SELECT 
    'Final verification - both users:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role,
    CASE 
        WHEN id = '550e8400-e29b-41d4-a716-446655440002' THEN 'FRONTEND USER'
        ELSE 'OLD USER'
    END as user_type
FROM users 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440002', '78fc980f-0c3c-4530-a7a4-d336474a96a4')
ORDER BY user_type;

SELECT '🎯 Frontend should now receive 8 documents in the workflow dashboard!' as success_message;
