-- =====================================================
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This fixes the 404 error for get_documents_by_workflow_status
-- =====================================================

-- Step 1: Clean up existing functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname = 'get_documents_by_workflow_status'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION ' || func_record.oid::regprocedure;
        EXCEPTION 
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Step 2: Create the correct function
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
        (status_filter IS NULL OR status_filter = 'all' OR d.status::TEXT = status_filter) AND
        (
            status_filter = 'published' OR 
            d.status::TEXT IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
        ) AND
        (
            d.user_id = user_id_param OR
            d.adviser_id = user_id_param OR
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

-- Step 4: Refresh schema
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'Function created successfully!' as status;
