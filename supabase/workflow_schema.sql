-- Enhanced workflow schema for UBrary document submission process
-- This extends the existing schema with additional workflow states and review tracking

-- Update document status enum to include all workflow states
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'needs_revision';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'curation';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'ready_for_publication';

-- Document reviews table for tracking review process
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('initial', 'revision', 'final')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    comments TEXT,
    recommendations TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    is_approved BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Document workflow history table for audit trail
CREATE TABLE IF NOT EXISTS document_workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    from_status document_status,
    to_status document_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document revision requests table
CREATE TABLE IF NOT EXISTS document_revision_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_from UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    specific_requirements TEXT,
    deadline TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Document curation notes table
CREATE TABLE IF NOT EXISTS document_curation_notes (
    id UUID PRIMARY KEY PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    curator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('metadata', 'content', 'formatting', 'accessibility', 'final_check')),
    note TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_reviews_document_id ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_reviewer_id ON document_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_status ON document_reviews(status);
CREATE INDEX IF NOT EXISTS idx_document_workflow_history_document_id ON document_workflow_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_history_created_at ON document_workflow_history(created_at);
CREATE INDEX IF NOT EXISTS idx_document_revision_requests_document_id ON document_revision_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_document_revision_requests_status ON document_revision_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_curation_notes_document_id ON document_curation_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_document_curation_notes_curator_id ON document_curation_notes(curator_id);

-- Functions for workflow management

-- Function to update document status with history tracking
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
        updated_at = NOW(),
        published_at = CASE WHEN new_status = 'published' THEN NOW() ELSE published_at END
    WHERE id = document_id_param;
    
    -- Log the status change
    INSERT INTO document_workflow_history (
        document_id, from_status, to_status, changed_by, reason, comments
    ) VALUES (
        document_id_param, current_status, new_status, changed_by_param, reason_param, comments_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document workflow status
CREATE OR REPLACE FUNCTION get_document_workflow_status(document_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'document_id', d.id,
        'current_status', d.status,
        'submitted_at', d.created_at,
        'last_updated', d.updated_at,
        'published_at', d.published_at,
        'workflow_history', (
            SELECT json_agg(
                json_build_object(
                    'from_status', from_status,
                    'to_status', to_status,
                    'changed_by', u.first_name || ' ' || u.last_name,
                    'reason', reason,
                    'comments', comments,
                    'created_at', created_at
                )
            )
            FROM document_workflow_history h
            LEFT JOIN users u ON h.changed_by = u.id
            WHERE h.document_id = document_id_param
            ORDER BY h.created_at DESC
        ),
        'current_reviews', (
            SELECT json_agg(
                json_build_object(
                    'reviewer', u.first_name || ' ' || u.last_name,
                    'review_type', review_type,
                    'status', status,
                    'score', score,
                    'is_approved', is_approved,
                    'comments', comments,
                    'created_at', created_at
                )
            )
            FROM document_reviews r
            LEFT JOIN users u ON r.reviewer_id = u.id
            WHERE r.document_id = document_id_param
            AND r.status != 'completed'
        ),
        'pending_revisions', (
            SELECT json_agg(
                json_build_object(
                    'requested_by', u1.first_name || ' ' || u1.last_name,
                    'requested_from', u2.first_name || ' ' || u2.last_name,
                    'reason', reason,
                    'deadline', deadline,
                    'status', status,
                    'created_at', created_at
                )
            )
            FROM document_revision_requests rr
            LEFT JOIN users u1 ON rr.requested_by = u1.id
            LEFT JOIN users u2 ON rr.requested_from = u2.id
            WHERE rr.document_id = document_id_param
            AND rr.status IN ('pending', 'in_progress')
        )
    ) INTO result
    FROM documents d
    WHERE d.id = document_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get documents by workflow status for different user roles
CREATE OR REPLACE FUNCTION get_documents_by_workflow_status(
    user_id_param UUID,
    status_filter document_status DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    abstract TEXT,
    program VARCHAR(255),
    year INTEGER,
    status document_status,
    author_names TEXT,
    adviser_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
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
        d.status,
        STRING_AGG(DISTINCT u.first_name || ' ' || u.last_name, ', ') as author_names,
        adviser.first_name || ' ' || adviser.last_name as adviser_name,
        d.created_at,
        d.updated_at,
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
    LEFT JOIN document_authors da ON d.id = da.document_id
    LEFT JOIN users u ON da.user_id = u.id
    LEFT JOIN users adviser ON d.adviser_id = adviser.id
    WHERE 
        (status_filter IS NULL OR d.status = status_filter) AND
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
    GROUP BY d.id, d.title, d.abstract, d.program, d.year, d.status, 
             adviser.first_name, adviser.last_name, d.created_at, d.updated_at
    ORDER BY workflow_position ASC, d.updated_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for new tables
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_curation_notes ENABLE ROW LEVEL SECURITY;

-- Document reviews policies
CREATE POLICY "Users can view reviews for their documents" ON document_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_reviews.document_id 
            AND (user_id = auth.uid()::text OR adviser_id = auth.uid()::text)
        ) OR
        reviewer_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('librarian', 'admin')
        )
    );

CREATE POLICY "Reviewers can create and update their reviews" ON document_reviews
    FOR ALL USING (
        reviewer_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('librarian', 'admin')
        )
    );

-- Workflow history policies
CREATE POLICY "Users can view workflow history for their documents" ON document_workflow_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_workflow_history.document_id 
            AND (user_id = auth.uid()::text OR adviser_id = auth.uid()::text)
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('librarian', 'admin')
        )
    );

-- Revision requests policies
CREATE POLICY "Users can view revision requests for their documents" ON document_revision_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_revision_requests.document_id 
            AND (user_id = auth.uid()::text OR adviser_id = auth.uid()::text)
        ) OR
        requested_by = auth.uid()::text OR
        requested_from = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('librarian', 'admin')
        )
    );

-- Curation notes policies
CREATE POLICY "Users can view curation notes for their documents" ON document_curation_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_curation_notes.document_id 
            AND (user_id = auth.uid()::text OR adviser_id = auth.uid()::text)
        ) OR
        curator_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('librarian', 'admin')
        )
    );
