-- =====================================================
-- DEBUG ASSIGNMENT ISSUE - Run in Supabase SQL Editor  
-- Check if the adviser assignments actually worked
-- =====================================================

-- 1. Check if Dr. Maria Santos exists and get her ID
SELECT 
    'Dr. Maria Santos info:' as info,
    id,
    first_name || ' ' || last_name as name,
    email,
    role
FROM users 
WHERE role = 'faculty' OR first_name ILIKE '%maria%' OR last_name ILIKE '%santos%';

-- 2. Check current document assignments
SELECT 
    'Current document assignments:' as info,
    d.id,
    d.title,
    d.status,
    d.user_id,
    d.adviser_id,
    d.adviser_name,
    u1.first_name || ' ' || u1.last_name as author_name,
    u2.first_name || ' ' || u2.last_name as actual_adviser_name
FROM documents d
LEFT JOIN users u1 ON d.user_id = u1.id  
LEFT JOIN users u2 ON d.adviser_id = u2.id
ORDER BY d.updated_at DESC;

-- 3. Count documents by adviser_id
SELECT 
    'Documents by adviser:' as info,
    d.adviser_id,
    u.first_name || ' ' || u.last_name as adviser_name,
    u.role,
    COUNT(*) as document_count
FROM documents d
LEFT JOIN users u ON d.adviser_id = u.id
GROUP BY d.adviser_id, u.first_name, u.last_name, u.role
ORDER BY document_count DESC;

-- 4. Test the workflow function with faculty user
SELECT 
    'Testing workflow function:' as info,
    COUNT(*) as returned_documents
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    50,
    0
);

-- 5. Manual test of the role-based access logic
WITH faculty_user AS (
    SELECT id FROM users WHERE role = 'faculty' LIMIT 1
)
SELECT 
    'Documents accessible to faculty user:' as info,
    COUNT(*) as accessible_count
FROM documents d, faculty_user f
WHERE 
    d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    AND (
        d.user_id = f.id OR           -- Student's own documents
        d.adviser_id = f.id OR        -- Documents they advise
        EXISTS (                      -- Admin/librarian access
            SELECT 1 FROM users u
            WHERE u.id = f.id AND u.role IN ('librarian', 'admin')
        )
    );
