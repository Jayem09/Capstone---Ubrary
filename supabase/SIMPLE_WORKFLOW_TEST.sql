-- =====================================================
-- SIMPLE WORKFLOW TEST - Run in Supabase SQL Editor
-- Let's test the workflow function step by step
-- =====================================================

-- Step 1: Get the faculty user ID (Dr. Maria Santos)
SELECT 
    'Faculty User ID:' as info,
    id as user_id,
    first_name || ' ' || last_name as name,
    role
FROM users 
WHERE role = 'faculty' 
LIMIT 1;

-- Step 2: Test the workflow function with hardcoded ID
-- Replace this UUID with the actual faculty user ID from Step 1
DO $$
DECLARE
    faculty_id UUID;
    doc_count INTEGER;
BEGIN
    -- Get faculty user ID
    SELECT id INTO faculty_id FROM users WHERE role = 'faculty' LIMIT 1;
    
    IF faculty_id IS NULL THEN
        RAISE NOTICE 'No faculty user found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with faculty ID: %', faculty_id;
    
    -- Test the function
    SELECT COUNT(*) INTO doc_count
    FROM get_documents_by_workflow_status(faculty_id, NULL, 50, 0);
    
    RAISE NOTICE 'Function returned % documents', doc_count;
    
    -- If no documents, let's see what's in the documents table
    IF doc_count = 0 THEN
        RAISE NOTICE 'No documents returned. Checking documents table...';
        
        SELECT COUNT(*) INTO doc_count FROM documents;
        RAISE NOTICE 'Total documents in table: %', doc_count;
        
        SELECT COUNT(*) INTO doc_count 
        FROM documents 
        WHERE status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');
        RAISE NOTICE 'Workflow documents in table: %', doc_count;
        
        SELECT COUNT(*) INTO doc_count 
        FROM documents 
        WHERE adviser_id = faculty_id;
        RAISE NOTICE 'Documents where faculty is adviser: %', doc_count;
    END IF;
END $$;

-- Step 3: Show actual function results
SELECT 
    'Workflow Function Results:' as info,
    id,
    title,
    status,
    author_names,
    adviser_name
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    10,
    0
);

-- Step 4: If still no results, let's check the function definition
SELECT 
    'Function exists:' as info,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

-- Step 5: Manual query to see what SHOULD be returned
WITH faculty_user AS (
    SELECT id FROM users WHERE role = 'faculty' LIMIT 1
)
SELECT 
    'Manual Query Results:' as info,
    d.id,
    d.title,
    d.status::VARCHAR(50) as status,
    d.author_names,
    d.adviser_name,
    CASE 
        WHEN d.user_id = f.id THEN 'own'
        WHEN d.adviser_id = f.id THEN 'advising'
        ELSE 'admin'
    END as access_type
FROM documents d, faculty_user f
WHERE 
    (NULL IS NULL OR d.status::TEXT = NULL) AND
    (
        NULL = 'published' OR 
        d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    ) AND
    (
        d.user_id = f.id OR
        d.adviser_id = f.id OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = f.id AND u.role IN ('librarian', 'admin')
        )
    )
ORDER BY d.updated_at DESC
LIMIT 10;
