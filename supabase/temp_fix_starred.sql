-- Temporary fix for starred_documents RLS issues in development

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS starred_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_starred_documents_user_id ON starred_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_documents_document_id ON starred_documents(document_id);

-- Disable RLS temporarily for development
ALTER TABLE starred_documents DISABLE ROW LEVEL SECURITY;

-- Re-create the toggle function
CREATE OR REPLACE FUNCTION toggle_document_star(document_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_val UUID := auth.uid();
    is_starred BOOLEAN;
BEGIN
    -- Check if user is authenticated
    IF user_id_val IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
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

-- Grant permissions
GRANT ALL ON starred_documents TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_document_star TO authenticated;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

SELECT 'Starred documents table fixed for development!' as status;
