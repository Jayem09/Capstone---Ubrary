-- Add starred documents functionality

-- Create starred_documents table
CREATE TABLE IF NOT EXISTS starred_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_id)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_starred_documents_user_id ON starred_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_documents_document_id ON starred_documents(document_id);

-- Add RLS policies for starred documents
ALTER TABLE starred_documents ENABLE ROW LEVEL SECURITY;

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION toggle_document_star TO authenticated;
GRANT EXECUTE ON FUNCTION get_starred_documents TO authenticated;

-- Show success message
SELECT 'Starred documents functionality added successfully!' as status;
