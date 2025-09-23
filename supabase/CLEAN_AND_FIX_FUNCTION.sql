-- CLEAN AND FIX FUNCTION - Execute this in Supabase SQL Editor
-- This removes all conflicting function versions and creates the correct one

-- Step 1: Drop all existing versions of the function
DROP FUNCTION IF EXISTS update_document_status_with_history(UUID, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_document_status_with_history(UUID, document_status, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_document_status_with_history CASCADE;

-- Step 2: Ensure document_status enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM (
            'pending',
            'under_review', 
            'needs_revision',
            'approved',
            'curation',
            'ready_for_publication',
            'published',
            'rejected'
        );
        RAISE NOTICE 'Created document_status enum type';
    ELSE
        RAISE NOTICE 'document_status enum already exists';
    END IF;
END $$;

-- Step 3: Create the correct function with proper enum type
CREATE OR REPLACE FUNCTION update_document_status_with_history(
    document_id_param UUID,
    new_status document_status,
    changed_by_param UUID,
    reason_param TEXT DEFAULT NULL,
    comments_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_status document_status;
BEGIN
    -- Validate inputs
    IF document_id_param IS NULL THEN
        RAISE EXCEPTION 'Document ID cannot be null';
    END IF;
    
    IF changed_by_param IS NULL THEN
        RAISE EXCEPTION 'Changed by user ID cannot be null';
    END IF;
    
    -- Get current status
    SELECT status INTO current_status FROM documents WHERE id = document_id_param;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Document with ID % not found', document_id_param;
    END IF;
    
    -- Update document status
    UPDATE documents 
    SET status = new_status, 
        updated_at = NOW()
    WHERE id = document_id_param;
    
    -- Create workflow history table if it doesn't exist
    CREATE TABLE IF NOT EXISTS document_workflow_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        from_status document_status,
        to_status document_status,
        changed_by UUID REFERENCES users(id),
        reason TEXT,
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert history record
    INSERT INTO document_workflow_history (
        document_id, from_status, to_status, changed_by, reason, comments
    ) VALUES (
        document_id_param, current_status, new_status, changed_by_param, reason_param, comments_param
    );
    
    RAISE NOTICE 'Document % status updated from % to % by user %', 
        document_id_param, current_status, new_status, changed_by_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION update_document_status_with_history(UUID, document_status, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status_with_history(UUID, document_status, UUID, TEXT, TEXT) TO service_role;

-- Step 5: Create indexes for workflow history table
CREATE INDEX IF NOT EXISTS idx_workflow_history_document_id ON document_workflow_history(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON document_workflow_history(created_at);

-- Step 6: Enable RLS on workflow history table
ALTER TABLE document_workflow_history ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for workflow history
DROP POLICY IF EXISTS "Users can view workflow history" ON document_workflow_history;
DROP POLICY IF EXISTS "Authorized users can insert workflow history" ON document_workflow_history;

CREATE POLICY "Users can view workflow history" ON document_workflow_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_workflow_history.document_id
            AND (
                d.user_id = auth.uid() OR  -- Document owner
                d.adviser_id = auth.uid() OR  -- Document adviser
                auth.jwt() ->> 'role' IN ('librarian', 'admin')  -- Librarian or admin
            )
        )
    );

CREATE POLICY "Authorized users can insert workflow history" ON document_workflow_history
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('faculty', 'librarian', 'admin') OR
        changed_by = auth.uid()
    );

-- Step 8: Test the function exists and is unique
SELECT 
    r.routine_name, 
    r.routine_type,
    r.data_type as return_type,
    array_agg(p.parameter_name || ':' || p.data_type ORDER BY p.ordinal_position) as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'update_document_status_with_history'
GROUP BY r.routine_name, r.routine_type, r.data_type;

-- Step 9: Show available test documents
SELECT 
    id, 
    title, 
    status, 
    user_id, 
    adviser_id,
    created_at
FROM documents 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Function cleaned and recreated successfully!' as result;
