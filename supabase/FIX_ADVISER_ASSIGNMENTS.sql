-- =====================================================
-- FIX ADVISER ASSIGNMENTS - Run in Supabase SQL Editor
-- This assigns Dr. Maria Santos as adviser to existing documents
-- =====================================================

-- First, let's find Dr. Maria Santos' user ID
SELECT 
    'Dr. Maria Santos user info:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role
FROM users 
WHERE (first_name ILIKE '%maria%' OR last_name ILIKE '%santos%' OR email ILIKE '%maria%')
   OR role = 'faculty'
LIMIT 5;

-- Get the faculty/adviser user ID (assuming Dr. Maria Santos exists)
-- If she doesn't exist, we'll create her
DO $$
DECLARE
    faculty_user_id UUID;
    student_user_id UUID;
BEGIN
    -- Try to find Dr. Maria Santos
    SELECT id INTO faculty_user_id 
    FROM users 
    WHERE (first_name ILIKE '%maria%' OR last_name ILIKE '%santos%') 
       OR role = 'faculty'
    LIMIT 1;
    
    -- If no faculty user found, create Dr. Maria Santos
    IF faculty_user_id IS NULL THEN
        INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'maria.santos@ub.edu.ph',
            'Maria',
            'Santos',
            'faculty',
            NOW(),
            NOW()
        ) RETURNING id INTO faculty_user_id;
        
        RAISE NOTICE 'Created Dr. Maria Santos with ID: %', faculty_user_id;
    ELSE
        RAISE NOTICE 'Found faculty user with ID: %', faculty_user_id;
    END IF;
    
    -- Get a student user ID for realistic relationships
    SELECT id INTO student_user_id 
    FROM users 
    WHERE role = 'student' 
    LIMIT 1;
    
    -- Update existing documents to have proper adviser relationships
    -- Assign Dr. Maria Santos as adviser to some documents
    UPDATE documents 
    SET 
        adviser_id = faculty_user_id,  -- Use the variable we declared
        adviser_name = 'Dr. Maria Santos',
        updated_at = NOW()
    WHERE id IN (
        SELECT id FROM documents 
        WHERE status = 'pending'
        LIMIT 3  -- Assign her to 3 documents
    );
    
    -- Also create some documents in different workflow stages for testing
    INSERT INTO documents (
        id,
        title,
        abstract,
        program,
        year,
        status,
        user_id,
        adviser_id,
        author_names,
        adviser_name,
        pages,
        file_size,
        download_count,
        view_count,
        created_at,
        updated_at
    ) VALUES 
    -- Under Review document
    (
        gen_random_uuid(),
        'Machine Learning Applications in Healthcare',
        'This thesis explores the application of machine learning algorithms in healthcare diagnosis and treatment optimization.',
        'Information Technology',
        2024,
        'under_review',
        student_user_id,
        faculty_user_id,
        'John Student',
        'Dr. Maria Santos',
        120,
        '2.5 MB',
        0,
        0,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
    ),
    -- Needs Revision document  
    (
        gen_random_uuid(),
        'Sustainable Engineering Practices',
        'An analysis of sustainable practices in modern engineering projects and their environmental impact.',
        'Engineering',
        2024,
        'needs_revision',
        student_user_id,
        faculty_user_id,
        'Jane Engineer',
        'Dr. Maria Santos',
        95,
        '1.8 MB',
        0,
        0,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '2 days'
    ),
    -- Approved document
    (
        gen_random_uuid(),
        'Digital Marketing Strategies for SMEs',
        'A comprehensive study of digital marketing strategies and their effectiveness for small and medium enterprises.',
        'Business',
        2024,
        'approved',
        student_user_id,
        faculty_user_id,
        'Mike Business',
        'Dr. Maria Santos',
        88,
        '1.2 MB',
        0,
        0,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '3 days'
    );
    
    RAISE NOTICE 'Updated existing documents and created sample workflow documents';
    
END $$;

-- Verify the changes
SELECT 
    'Updated documents for Dr. Maria Santos:' as info,
    d.title,
    d.status,
    d.author_names,
    d.adviser_name,
    u.first_name || ' ' || u.last_name as adviser_full_name
FROM documents d
LEFT JOIN users u ON d.adviser_id = u.id
WHERE u.role = 'faculty' OR d.adviser_name ILIKE '%maria%'
ORDER BY d.updated_at DESC;

-- Test the function again
SELECT 
    'Testing workflow function with faculty user:' as test_info,
    COUNT(*) as documents_returned
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    50,
    0
);

SELECT '🎯 Dr. Maria Santos should now see documents in her Workflow dashboard!' as success_message;
