-- Complete fix for workflow function - handles all function signatures

-- First, let's see what functions exist
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

-- Drop ALL possible function signatures
DO $$
BEGIN
    -- Try to drop all possible variations
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(INTEGER, INTEGER, UUID);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(INTEGER, INTEGER, TEXT);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(UUID, TEXT, INTEGER, INTEGER);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(UUID, document_status, INTEGER, INTEGER);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(user_id_param UUID, status_filter TEXT, limit_count INTEGER, offset_count INTEGER);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(limit_count INTEGER, offset_count INTEGER, user_id_param UUID);
    EXCEPTION WHEN others THEN
        NULL;
    END;
    
    BEGIN
        DROP FUNCTION get_documents_by_workflow_status(limit_count INTEGER, offset_count INTEGER, status_filter TEXT);
    EXCEPTION WHEN others THEN
        NULL;
    END;
END $$;

-- Now create the correct function with the expected signature
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
        CASE d.status
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
        -- Apply status filter if provided
        (status_filter IS NULL OR status_filter = 'all' OR d.status = status_filter) AND
        -- Only show workflow documents (not published)
        d.status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication') AND
        (
            -- Students can see their own documents
            d.user_id = user_id_param OR
            -- Faculty can see documents they're advising
            d.adviser_id = user_id_param OR
            -- Librarians and admins can see all documents
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = user_id_param AND role IN ('librarian', 'admin')
            )
        )
    ORDER BY workflow_position ASC, d.updated_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status TO authenticated;

-- Force refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Show what functions exist now
SELECT 
    'Function recreated successfully!' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';
