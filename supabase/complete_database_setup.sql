-- Complete Database Setup Script
-- This script creates all missing tables, functions, and policies

-- ===========================================
-- 1. STARRED DOCUMENTS FUNCTIONALITY
-- ===========================================

-- Create starred_documents table
CREATE TABLE IF NOT EXISTS starred_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_starred_documents_user_id ON starred_documents(user_id);x
CREATE INDEX IF NOT EXISTS idx_starred_documents_document_id ON starred_documents(document_id);

-- Add RLS policies for starred documents
ALTER TABLE starred_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own starred documents" ON starred_documents;
DROP POLICY IF EXISTS "Users can star documents" ON starred_documents;
DROP POLICY IF EXISTS "Users can unstar documents" ON starred_documents;

-- Users can only see their own starred documents
CREATE POLICY "Users can view own starred documents" ON starred_documents
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can star documents
CREATE POLICY "Users can star documents" ON starred_documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can unstar documents
CREATE POLICY "Users can unstar documents" ON starred_documents
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Function to toggle starred status
CREATE OR REPLACE FUNCTION toggle_document_star(document_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_val UUID := auth.uid();
    is_starred BOOLEAN;
BEGIN
    -- Check if document is already starred
    SELECT EXISTS(
        SELECT 1 FROM starred_documents 
        WHERE user_id = user_id_val AND document_id = document_id_param
    ) INTO is_starred;
    
    IF is_starred THEN
        -- Remove star
        DELETE FROM starred_documents 
        WHERE user_id = user_id_val AND document_id = document_id_param;
        RETURN FALSE;
    ELSE
        -- Add star
        INSERT INTO starred_documents (user_id, document_id) 
        VALUES (user_id_val, document_id_param);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's starred documents
CREATE OR REPLACE FUNCTION get_starred_documents(
    user_id_param UUID DEFAULT NULL,
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
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
    starred_at TIMESTAMPTZ
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
        d.author_names,
        d.adviser_name,
        d.pages,
        d.file_size,
        d.download_count,
        d.view_count,
        d.created_at,
        d.updated_at,
        d.published_at,
        sd.created_at as starred_at
    FROM documents d
    INNER JOIN starred_documents sd ON d.id = sd.document_id
    WHERE sd.user_id = COALESCE(user_id_param, auth.uid())
    ORDER BY sd.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 2. DOCUMENT REVIEWS TABLE
-- ===========================================

-- Create document_reviews table
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL DEFAULT 'initial',
    comments TEXT,
    recommendations TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_reviews_document_id ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer_id ON document_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_status ON document_reviews(status);

-- Add RLS policies for document reviews
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view relevant reviews" ON document_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON document_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON document_reviews;

-- Users can view reviews for documents they have access to
CREATE POLICY "Users can view relevant reviews" ON document_reviews
    FOR SELECT USING (
        auth.uid()::text = reviewer_id::text OR
        auth.uid()::text IN (
            SELECT user_id::text FROM documents WHERE id = document_id
        )
    );

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON document_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = reviewer_id::text);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON document_reviews
    FOR UPDATE USING (auth.uid()::text = reviewer_id::text);

-- ===========================================
-- 3. DOCUMENT REVISION REQUESTS TABLE
-- ===========================================

-- Create document_revision_requests table
CREATE TABLE IF NOT EXISTS document_revision_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_from UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'revision',
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_revision_requests_document_id ON document_revision_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_document_revision_requests_requested_from ON document_revision_requests(requested_from);
CREATE INDEX IF NOT EXISTS idx_document_revision_requests_status ON document_revision_requests(status);

-- Add RLS policies for revision requests
ALTER TABLE document_revision_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view relevant revision requests" ON document_revision_requests;
DROP POLICY IF EXISTS "Users can create revision requests" ON document_revision_requests;
DROP POLICY IF EXISTS "Users can update relevant revision requests" ON document_revision_requests;

-- Users can view revision requests they're involved in
CREATE POLICY "Users can view relevant revision requests" ON document_revision_requests
    FOR SELECT USING (
        auth.uid()::text = requested_by::text OR
        auth.uid()::text = requested_from::text
    );

-- Users can create revision requests
CREATE POLICY "Users can create revision requests" ON document_revision_requests
    FOR INSERT WITH CHECK (auth.uid()::text = requested_by::text);

-- Users can update revision requests they're involved in
CREATE POLICY "Users can update relevant revision requests" ON document_revision_requests
    FOR UPDATE USING (
        auth.uid()::text = requested_by::text OR
        auth.uid()::text = requested_from::text
    );

-- ===========================================
-- 4. WORKFLOW FUNCTIONS
-- ===========================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_documents_by_workflow_status(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_documents_by_workflow_status(INTEGER, INTEGER, UUID);

-- Create the workflow function that the frontend expects
CREATE OR REPLACE FUNCTION get_documents_by_workflow_status(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0,
    user_id_param UUID DEFAULT NULL
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
    published_at TIMESTAMPTZ
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
        d.author_names,
        d.adviser_name,
        d.pages,
        d.file_size,
        d.download_count,
        d.view_count,
        d.created_at,
        d.updated_at,
        d.published_at
    FROM documents d
    WHERE 
        (user_id_param IS NULL OR d.user_id = user_id_param)
        AND d.status IN ('pending', 'under_review', 'needs_revision', 'approved', 'curation', 'ready_for_publication')
    ORDER BY d.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create the alternative function signature that might be expected
CREATE OR REPLACE FUNCTION get_documents_by_workflow_status(
    limit_count INTEGER,
    offset_count INTEGER,
    status_filter TEXT
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
    published_at TIMESTAMPTZ
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
        d.author_names,
        d.adviser_name,
        d.pages,
        d.file_size,
        d.download_count,
        d.view_count,
        d.created_at,
        d.updated_at,
        d.published_at
    FROM documents d
    WHERE 
        (status_filter IS NULL OR status_filter = 'all' OR d.status = status_filter)
    ORDER BY d.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 5. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions for starred functions
GRANT EXECUTE ON FUNCTION toggle_document_star TO authenticated;
GRANT EXECUTE ON FUNCTION get_starred_documents TO authenticated;

-- Grant permissions for workflow functions
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status(INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_by_workflow_status(INTEGER, INTEGER, TEXT) TO authenticated;

-- ===========================================
-- 6. REFRESH SCHEMA CACHE
-- ===========================================

-- Force refresh of the schema cache
NOTIFY pgrst, 'reload schema';

-- Show success message
SELECT 
    'Database setup complete!' as status,
    'Created starred_documents table with functions' as starred_status,
    'Created workflow functions' as workflow_status,
    'All permissions granted' as permissions_status;
