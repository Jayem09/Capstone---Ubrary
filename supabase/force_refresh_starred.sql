-- Force refresh and verify starred_documents table

-- First, check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'starred_documents') 
        THEN 'Table exists' 
        ELSE 'Table does not exist' 
    END as table_status;

-- Drop and recreate the table to ensure it's properly set up
DROP TABLE IF EXISTS starred_documents CASCADE;

-- Recreate the table
CREATE TABLE starred_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_id)
);

-- Add indexes
CREATE INDEX idx_starred_documents_user_id ON starred_documents(user_id);
CREATE INDEX idx_starred_documents_document_id ON starred_documents(document_id);

-- Disable RLS completely for development
ALTER TABLE starred_documents DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON starred_documents TO authenticated;
GRANT ALL PRIVILEGES ON starred_documents TO anon;

-- Recreate the toggle function
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

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION toggle_document_star TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_document_star TO anon;

-- Force refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Wait a moment and notify again
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Verify the table is accessible
SELECT 
    'starred_documents table recreated successfully!' as status,
    COUNT(*) as current_records
FROM starred_documents;

-- Show table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'starred_documents';
