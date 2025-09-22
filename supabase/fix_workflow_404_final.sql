-- Final fix for workflow function 404 error and type casting issue
-- This addresses both the missing function and the document_status = text operator error

-- First, completely clean up ALL existing function signatures
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through each function with this name and drop it using OID
    FOR func_record IN 
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname = 'get_documents_by_workflow_status'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION ' || func_record.oid::regprocedure;
            RAISE NOTICE 'Dropped function: %', func_record.oid::regprocedure;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function %: %', func_record.oid::regprocedure, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify cleanup
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'All functions dropped successfully!'
        ELSE 'Still have ' || COUNT(*) || ' functions remaining'
    END as cleanup_status
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

-- Create the function with the EXACT signature the frontend expects
-- Key fix: Use TEXT comparison instead of document_status enum comparison
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
        d.status::VARCHAR(50),  -- Cast to VARCHAR to avoid enum issues
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
        CASE d.status::TEXT  -- Cast to TEXT for comparison
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
        -- Apply status filter if provided (KEY FIX: Cast both sides to TEXT)
        (status_filter IS NULL OR status_filter = 'all' OR d.status::TEXT = status_filter) AND
        -- Only show workflow documents (not published unless specifically requested)
        (
            status_filter = 'published' OR 
            d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
        ) AND
        -- Role-based access control
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

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status TO authenticated;

-- Force refresh the PostgREST schema cache to make function available immediately
NOTIFY pgrst, 'reload schema';

-- Final verification
SELECT 
    '✅ SUCCESS! Function created with signature:' as final_status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

-- Test the function to ensure it works
SELECT 
    '🧪 Testing function...' as test_status,
    COUNT(*) as document_count
FROM get_documents_by_workflow_status(
    (SELECT u.id FROM users u LIMIT 1),  -- Use first user as test
    NULL,  -- No status filter
    10,    -- Limit 10
    0      -- No offset
);

SELECT '🎯 Workflow dashboard should now load without 404 errors!' as success_message;
