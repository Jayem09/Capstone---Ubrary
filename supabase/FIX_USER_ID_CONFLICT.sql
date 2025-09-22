-- =====================================================
-- FIX USER ID CONFLICT - Run in Supabase SQL Editor
-- Handle the duplicate email issue and fix user ID mismatch
-- =====================================================

-- Step 1: Find the existing Maria Santos user
SELECT 
    'Existing Maria Santos user:' as info,
    id,
    email,
    first_name || ' ' || last_name as name,
    role,
    created_at
FROM users 
WHERE email = 'maria.santos@ub.edu.ph' OR first_name ILIKE '%maria%' OR last_name ILIKE '%santos%';

-- Step 2: Check what user ID the frontend is actually using
SELECT 
    'Frontend expects this user ID:' as info,
    '550e8400-e29b-41d4-a716-446655440002' as expected_id;

-- Step 3: Update the existing Maria Santos user to have the correct ID
-- First, let's see if we can update the ID directly
DO $$
DECLARE
    existing_user_id UUID;
    frontend_user_id UUID := '550e8400-e29b-41d4-a716-446655440002';
BEGIN
    -- Get the existing Maria Santos user ID
    SELECT id INTO existing_user_id 
    FROM users 
    WHERE email = 'maria.santos@ub.edu.ph' 
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing Maria Santos with ID: %', existing_user_id;
        RAISE NOTICE 'Frontend expects ID: %', frontend_user_id;
        
        -- Check if frontend ID already exists
        IF EXISTS (SELECT 1 FROM users WHERE id = frontend_user_id) THEN
            RAISE NOTICE 'Frontend user ID already exists. Will reassign documents to existing user.';
            
            -- Update documents to use the existing Maria Santos user ID
            UPDATE documents 
            SET 
                adviser_id = existing_user_id,
                adviser_name = 'Dr. Maria Santos',
                updated_at = NOW()
            WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');
            
            RAISE NOTICE 'Documents reassigned to existing Maria Santos user';
            
        ELSE
            RAISE NOTICE 'Frontend user ID does not exist. Will update existing user ID.';
            
            -- Try to update the existing user's ID to match frontend expectation
            -- Note: This might not work if there are foreign key constraints
            BEGIN
                UPDATE users 
                SET id = frontend_user_id 
                WHERE id = existing_user_id;
                
                RAISE NOTICE 'Successfully updated user ID to match frontend';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not update user ID. Will work with existing ID.';
                
                -- Fallback: Update documents to use existing user ID
                UPDATE documents 
                SET 
                    adviser_id = existing_user_id,
                    adviser_name = 'Dr. Maria Santos',
                    updated_at = NOW()
                WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');
                
            END;
        END IF;
    ELSE
        RAISE NOTICE 'No existing Maria Santos user found. Creating new one.';
        
        -- Create the user with the frontend ID
        INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            frontend_user_id,
            'maria.santos.faculty@ub.edu.ph',  -- Different email to avoid conflict
            'Maria',
            'Santos',
            'faculty',
            NOW(),
            NOW()
        );
        
        -- Assign documents to the new user
        UPDATE documents 
        SET 
            adviser_id = frontend_user_id,
            adviser_name = 'Dr. Maria Santos',
            updated_at = NOW()
        WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');
        
    END IF;
END $$;

-- Step 4: Verify the final state
SELECT 
    'Final user state:' as info,
    id,
    email,
    first_name || ' ' || last_name as name,
    role
FROM users 
WHERE (email ILIKE '%maria%' AND email ILIKE '%santos%') 
   OR first_name ILIKE '%maria%' 
   OR last_name ILIKE '%santos%'
   OR id = '550e8400-e29b-41d4-a716-446655440002';

-- Step 5: Check document assignments
SELECT 
    'Document assignments after fix:' as info,
    adviser_id,
    COUNT(*) as document_count,
    array_agg(title) as titles
FROM documents 
WHERE status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
GROUP BY adviser_id;

-- Step 6: Test the function with both possible user IDs
-- Test with frontend expected ID
SELECT 
    'Test with frontend ID:' as test_info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    NULL,
    50,
    0
);

-- Test with existing Maria Santos ID (if different)
SELECT 
    'Test with existing Maria Santos ID:' as test_info,
    u.id as user_id,
    (SELECT COUNT(*) FROM get_documents_by_workflow_status(u.id, NULL, 50, 0)) as document_count
FROM users u
WHERE (email ILIKE '%maria%santos%' OR (first_name ILIKE '%maria%' AND last_name ILIKE '%santos%'))
  AND id != '550e8400-e29b-41d4-a716-446655440002'
LIMIT 1;

-- Step 7: Show actual results for whichever user has documents
SELECT 
    'Documents accessible to any Maria Santos user:' as final_test,
    d.id,
    d.title,
    d.status,
    d.adviser_id,
    u.first_name || ' ' || u.last_name as adviser_name
FROM documents d
JOIN users u ON d.adviser_id = u.id
WHERE d.status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
  AND (u.first_name ILIKE '%maria%' OR u.last_name ILIKE '%santos%')
ORDER BY d.updated_at DESC;
