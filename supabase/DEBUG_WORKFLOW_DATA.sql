-- =====================================================
-- DIAGNOSTIC SCRIPT - Run in Supabase SQL Editor
-- This will help us understand why no documents are returned
-- =====================================================

-- 1. Check if we have any documents at all
SELECT 
    'Total documents in database:' as check_type,
    COUNT(*) as count
FROM documents;

-- 2. Check document statuses
SELECT 
    'Documents by status:' as check_type,
    status,
    COUNT(*) as count
FROM documents
GROUP BY status
ORDER BY count DESC;

-- 3. Check if we have users
SELECT 
    'Total users:' as check_type,
    COUNT(*) as count
FROM users;

-- 4. Check user roles
SELECT 
    'Users by role:' as check_type,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- 5. Check documents with workflow statuses specifically
SELECT 
    'Workflow documents:' as check_type,
    COUNT(*) as count
FROM documents
WHERE status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication');

-- 6. Test the function with a sample user (if any exists)
SELECT 
    'Testing function with first user:' as test_info,
    COUNT(*) as documents_returned
FROM get_documents_by_workflow_status(
    (SELECT id FROM users LIMIT 1),
    NULL,
    50,
    0
);

-- 7. Check if there are any documents that match the role-based access control
SELECT 
    'Documents accessible by first user:' as check_type,
    COUNT(*) as count
FROM documents d
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = (SELECT id FROM users LIMIT 1))
AND (
    -- Students can see their own documents
    d.user_id = (SELECT id FROM users LIMIT 1) OR
    -- Faculty can see documents they're advising  
    d.adviser_id = (SELECT id FROM users LIMIT 1) OR
    -- Librarians and admins can see all documents
    EXISTS (
        SELECT 1 FROM users u2
        WHERE u2.id = (SELECT id FROM users LIMIT 1) 
        AND u2.role IN ('librarian', 'admin')
    )
);

-- 8. Show sample documents with their relationships
SELECT 
    'Sample documents:' as info,
    d.id,
    d.title,
    d.status::TEXT as status,
    d.user_id,
    d.adviser_id,
    u1.first_name || ' ' || u1.last_name as author,
    u1.role as author_role,
    u2.first_name || ' ' || u2.last_name as adviser,
    u2.role as adviser_role
FROM documents d
LEFT JOIN users u1 ON d.user_id = u1.id
LEFT JOIN users u2 ON d.adviser_id = u2.id
LIMIT 5;

-- 9. Check if the current demo user exists and their role
SELECT 
    'Demo user info:' as info,
    u.id,
    u.first_name || ' ' || u.last_name as name,
    u.email,
    u.role
FROM users u
WHERE u.email LIKE '%demo%' OR u.first_name LIKE '%Maria%' OR u.last_name LIKE '%Santos%'
LIMIT 5;
