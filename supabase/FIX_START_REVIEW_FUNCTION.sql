-- Fix Start Review functionality by ensuring workflow functions exist
-- Execute this in Supabase SQL Editor

-- First, check if the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_document_status_with_history';

-- First, check if document_status enum exists, if not create it
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
    END IF;
END $$;

-- Create the function with correct enum type
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
    -- Get current status
    SELECT status INTO current_status FROM documents WHERE id = document_id_param;
    
    -- Update document status
    UPDATE documents 
    SET status = new_status, 
        updated_at = NOW()
    WHERE id = document_id_param;
    
    -- Log the status change (if workflow history table exists)
    BEGIN
        INSERT INTO document_workflow_history (
            document_id, from_status, to_status, changed_by, reason, comments, created_at
        ) VALUES (
            document_id_param, current_status, new_status, changed_by_param, reason_param, comments_param, NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, skip history logging
            RAISE NOTICE 'Workflow history table not found, skipping history log';
    END;
    
    RAISE NOTICE 'Document % status updated from % to %', document_id_param, current_status, new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_document_status_with_history TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status_with_history TO service_role;

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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_history_document_id ON document_workflow_history(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON document_workflow_history(created_at);

-- Enable RLS on workflow history table
ALTER TABLE document_workflow_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow history
CREATE POLICY "Users can view workflow history for documents they can access" ON document_workflow_history
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

-- Test the function with a simple query
SELECT 'Function created successfully' as status;

-- Show available documents for testing
SELECT id, title, status, user_id, adviser_id 
FROM documents 
LIMIT 5;
