-- =====================================================
-- FIX WORKFLOW FUNCTION FINAL - Run in Supabase SQL Editor
-- This recreates the function to match the manual query that works
-- =====================================================

-- Step 1: Drop the existing function completely
DROP FUNCTION IF EXISTS get_documents_by_workflow_status(UUID, TEXT, INTEGER, INTEGER);

-- Step 2: Create the corrected function based on the working manual query
CREATE OR REPLACE FUNCTION get_documents_by_workflow_status(
    user_id_param UUID,
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    abstract TEXT,
    program VARCHAR(255),
    year INTEGER,
    status VARCHAR(50),
    user_id UUID,
    adviser_id UUID,
    author_names TEXT,
    adviser_name TEXT,
    pages INTEGER,
    file_size VARCHAR(20),
    download_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    workflow_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.abstract,
        d.program,
        d.year,
        d.status::VARCHAR(50),
        d.user_id,
        d.adviser_id,
        COALESCE(d.author_names, 'Unknown Author') as author_names,
        COALESCE(d.adviser_name, 'No Adviser') as adviser_name,
        COALESCE(d.pages, 0) as pages,
        COALESCE(d.file_size, '0 MB') as file_size,
        COALESCE(d.download_count, 0) as download_count,
        COALESCE(d.view_count, 0) as view_count,
        d.created_at,
        d.updated_at,
        d.published_at,
        CASE d.status::TEXT
            WHEN 'pending' THEN 1
            WHEN 'under_review' THEN 2
            WHEN 'needs_revision' THEN 3
            WHEN 'approved' THEN 4
            WHEN 'curation' THEN 5
            WHEN 'ready_for_publication' THEN 6
            WHEN 'published' THEN 7
            WHEN 'rejected' THEN 8
            ELSE 0
        END as workflow_position
    FROM documents d
    WHERE 
        -- Apply status filter if provided (fixed logic)
        (status_filter IS NULL OR d.status::TEXT = status_filter) AND
        -- Only show workflow documents OR published if specifically requested
        (
            status_filter = 'published' OR 
            d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
        ) AND
        -- Role-based access control (simplified and fixed)
        (
            -- Students can see their own documents
            d.user_id = user_id_param OR
            -- Faculty can see documents they're advising
            d.adviser_id = user_id_param OR
            -- Librarians and admins can see all documents
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = user_id_param AND u.role IN ('librarian', 'admin')
            )
        )
    ORDER BY workflow_position ASC, d.updated_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status TO anon;

-- Step 4: Force refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Test the function immediately
SELECT 
    'Testing fixed function:' as test_info,
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

-- Step 6: Count test
SELECT 
    'Function returns this many documents:' as count_info,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    NULL,
    50,
    0
);

-- Step 7: Test with specific status filters
SELECT 
    'Pending documents:' as filter_test,
    COUNT(*) as count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    'pending',
    50,
    0
);

SELECT 
    'Under review documents:' as filter_test,
    COUNT(*) as count
FROM get_documents_by_workflow_status(
    (SELECT id FROM users WHERE role = 'faculty' LIMIT 1),
    'under_review',
    50,
    0
);

SELECT '🎯 Function should now return 6 documents to Dr. Maria Santos!' as success_message;
