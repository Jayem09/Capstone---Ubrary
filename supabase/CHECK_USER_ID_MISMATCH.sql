-- =====================================================
-- CHECK USER ID MISMATCH - Run in Supabase SQL Editor
-- The frontend is using user ID: 550e8400-e29b-41d4-a716-446655440002
-- =====================================================

-- Step 1: Check if this user ID exists in our database
SELECT 
    'Frontend user ID check:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role,
    created_at
FROM users 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 2: Show all users to see what we actually have
SELECT 
    'All users in database:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Step 3: Test the function with the frontend's user ID
SELECT 
    'Testing function with frontend user ID:' as info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Step 4: Show which documents are assigned to which adviser IDs
SELECT 
    'Document adviser assignments:' as info,
    adviser_id,
    COUNT(*) as document_count,
    array_agg(title) as titles
FROM documents 
WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
GROUP BY adviser_id;

-- Step 5: Check if we need to reassign documents to the correct user ID
-- If the frontend user exists, let's assign documents to them
DO $$
DECLARE
    frontend_user_exists BOOLEAN;
    correct_faculty_id UUID;
BEGIN
    -- Check if frontend user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440002') 
    INTO frontend_user_exists;
    
    IF frontend_user_exists THEN
        RAISE NOTICE 'Frontend user exists! Reassigning documents to this user...';
        
        -- Update documents to use the frontend user as adviser
        UPDATE documents 
        SET 
            adviser_id = '550e8400-e29b-41d4-a716-446655440002',
            adviser_name = 'Dr. Maria Santos',
            updated_at = NOW()
        WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');
        
        RAISE NOTICE 'Documents reassigned successfully!';
    ELSE
        RAISE NOTICE 'Frontend user does not exist. Need to create or update user ID.';
        
        -- Get the faculty user we created
        SELECT id INTO correct_faculty_id FROM users WHERE role = 'faculty' LIMIT 1;
        
        IF correct_faculty_id IS NOT NULL THEN
            RAISE NOTICE 'Found faculty user: %', correct_faculty_id;
            RAISE NOTICE 'Frontend expects: 550e8400-e29b-41d4-a716-446655440002';
            RAISE NOTICE 'Need to either update user ID or create new user with correct ID';
        END IF;
    END IF;
END $$;

-- Step 6: Test again after potential reassignment
SELECT 
    'Testing function after fix:' as info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Step 7: Show the actual results
SELECT 
    'Documents for frontend user:' as info,
    id,
    title,
    status,
    author_names,
    adviser_name
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    10,
    0
);
