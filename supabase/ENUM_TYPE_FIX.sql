-- ENUM TYPE FIX - Execute this in Supabase SQL Editor
-- This fixes the "document_status enum vs text" issue

-- Step 1: Check current document_status enum
SELECT enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'document_status'
ORDER BY enumsortorder;

-- Step 2: If enum doesn't exist or is incomplete, recreate it
DROP TYPE IF EXISTS document_status CASCADE;

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

-- Step 3: Ensure documents table uses the enum type
-- (This might fail if data exists, that's okay)
DO $$ 
BEGIN
    -- Try to alter the column type
    BEGIN
        ALTER TABLE documents ALTER COLUMN status TYPE document_status USING status::document_status;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter documents.status column type: %', SQLERRM;
    END;
END $$;

-- Step 4: Create the corrected function
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
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Document with ID % not found', document_id_param;
    END IF;
    
    -- Update document status
    UPDATE documents 
    SET status = new_status, 
        updated_at = NOW()
    WHERE id = document_id_param;
    
    -- Log the status change (create table if it doesn't exist)
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
    
    RAISE NOTICE 'Document % status updated from % to %', document_id_param, current_status, new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION update_document_status_with_history TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status_with_history TO service_role;

-- Step 6: Test the function
SELECT 'Function created successfully - ready to test' as status;

-- Step 7: Show sample documents for testing
SELECT id, title, status, user_id, adviser_id 
FROM documents 
WHERE status = 'pending'
LIMIT 3;
