-- Debug and fix workflow function - find exact signatures and drop them specifically

-- First, let's see EXACTLY what function signatures exist
SELECT 
    'Existing function signatures:' as debug_info,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as exact_arguments,
    pg_get_function_arguments(p.oid) as full_signature,
    p.oid as function_oid
FROM pg_proc p
WHERE p.proname = 'get_documents_by_workflow_status'
ORDER BY p.oid;

-- Now let's drop each one specifically using the OID approach
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through each function with this name and drop it
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

-- Verify all functions are gone
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'All functions dropped successfully!'
        ELSE 'Still have ' || COUNT(*) || ' functions remaining'
    END as cleanup_status
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

-- Now create the correct function
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

-- Final verification
SELECT 
    'SUCCESS! Function recreated with signature:' as final_status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_documents_by_workflow_status';

SELECT '🎯 Faculty should now see documents they advise in the Workflow tab!' as success_message;
