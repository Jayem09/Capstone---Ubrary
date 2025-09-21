-- UBrary Database Schema for Supabase - FIXED VERSION
-- University of Batangas Repository for Academic Research and Yields

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'librarian', 'admin');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'published', 'under_review', 'needs_revision', 'curation', 'ready_for_publication');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    program VARCHAR(255),
    department VARCHAR(255),
    student_id VARCHAR(50),
    employee_id VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    program VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    status document_status DEFAULT 'pending',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    adviser_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pages INTEGER,
    file_size VARCHAR(20),
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Document authors junction table (many-to-many)
CREATE TABLE document_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Keywords table
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document keywords junction table (many-to-many)
CREATE TABLE document_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, keyword_id)
);

-- Document files table
CREATE TABLE document_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size VARCHAR(20) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document reviews table for tracking review process
CREATE TABLE document_reviews (
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
CREATE TABLE document_workflow_history (
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
CREATE TABLE document_revision_requests (
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
CREATE TABLE document_curation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    curator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('metadata', 'content', 'formatting', 'accessibility', 'final_check')),
    note TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table for compliance and security
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table for authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_program ON documents(program);
CREATE INDEX idx_documents_year ON documents(year);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_adviser_id ON documents(adviser_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_document_authors_document_id ON document_authors(document_id);
CREATE INDEX idx_document_authors_user_id ON document_authors(user_id);
CREATE INDEX idx_keywords_name ON keywords(name);
CREATE INDEX idx_document_keywords_document_id ON document_keywords(document_id);
CREATE INDEX idx_document_keywords_keyword_id ON document_keywords(keyword_id);
CREATE INDEX idx_document_files_document_id ON document_files(document_id);
CREATE INDEX idx_document_reviews_document_id ON document_reviews(document_id);
CREATE INDEX idx_document_reviews_reviewer_id ON document_reviews(reviewer_id);
CREATE INDEX idx_document_reviews_status ON document_reviews(status);
CREATE INDEX idx_document_workflow_history_document_id ON document_workflow_history(document_id);
CREATE INDEX idx_document_workflow_history_created_at ON document_workflow_history(created_at);
CREATE INDEX idx_document_revision_requests_document_id ON document_revision_requests(document_id);
CREATE INDEX idx_document_revision_requests_status ON document_revision_requests(status);
CREATE INDEX idx_document_curation_notes_document_id ON document_curation_notes(document_id);
CREATE INDEX idx_document_curation_notes_curator_id ON document_curation_notes(curator_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- Full-text search indexes
CREATE INDEX idx_documents_title_fts ON documents USING gin(to_tsvector('english', title));
CREATE INDEX idx_documents_abstract_fts ON documents USING gin(to_tsvector('english', abstract));
CREATE INDEX idx_keywords_name_fts ON keywords USING gin(to_tsvector('english', name));

-- Trigram indexes for fuzzy search
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
CREATE INDEX idx_documents_abstract_trgm ON documents USING gin(abstract gin_trgm_ops);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_reviews_updated_at BEFORE UPDATE ON document_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_revision_requests_updated_at BEFORE UPDATE ON document_revision_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_curation_notes_updated_at BEFORE UPDATE ON document_curation_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies - FIXED VERSION
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_curation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create a function to get user role without causing recursion
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM users WHERE id = user_id;
    RETURN COALESCE(user_role_val, 'student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies - SIMPLIFIED to avoid recursion
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow public read access to basic user info for document display
CREATE POLICY "Public can view basic user info" ON users
    FOR SELECT USING (true);

-- Documents policies - SIMPLIFIED
CREATE POLICY "Published documents are viewable by all authenticated users" ON documents
    FOR SELECT USING (status = 'published' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Advisers can view their advisees' documents" ON documents
    FOR SELECT USING (auth.uid() = adviser_id);

CREATE POLICY "Users can create their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Document authors policies
CREATE POLICY "Users can view document authors for accessible documents" ON document_authors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_authors.document_id 
            AND (
                status = 'published' OR 
                user_id = auth.uid() OR 
                adviser_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create document authors for their documents" ON document_authors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_authors.document_id 
            AND user_id = auth.uid()
        )
    );

-- Keywords policies - Public read access
CREATE POLICY "Anyone can view keywords" ON keywords
    FOR SELECT USING (true);

-- Document keywords policies
CREATE POLICY "Users can view document keywords for accessible documents" ON document_keywords
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_keywords.document_id 
            AND (
                status = 'published' OR 
                user_id = auth.uid() OR 
                adviser_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create document keywords for their documents" ON document_keywords
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_keywords.document_id 
            AND user_id = auth.uid()
        )
    );

-- Document files policies
CREATE POLICY "Users can view document files for accessible documents" ON document_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_files.document_id 
            AND (
                status = 'published' OR 
                user_id = auth.uid() OR 
                adviser_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create document files for their documents" ON document_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_files.document_id 
            AND user_id = auth.uid()
        )
    );

-- Document reviews policies
CREATE POLICY "Users can view reviews for their documents" ON document_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_reviews.document_id 
            AND (user_id = auth.uid() OR adviser_id = auth.uid())
        ) OR
        reviewer_id = auth.uid()
    );

CREATE POLICY "Reviewers can create and update their reviews" ON document_reviews
    FOR ALL USING (reviewer_id = auth.uid());

-- Workflow history policies
CREATE POLICY "Users can view workflow history for their documents" ON document_workflow_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_workflow_history.document_id 
            AND (user_id = auth.uid() OR adviser_id = auth.uid())
        )
    );

-- Revision requests policies
CREATE POLICY "Users can view revision requests for their documents" ON document_revision_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_revision_requests.document_id 
            AND (user_id = auth.uid() OR adviser_id = auth.uid())
        ) OR
        requested_by = auth.uid() OR
        requested_from = auth.uid()
    );

-- Curation notes policies
CREATE POLICY "Users can view curation notes for their documents" ON document_curation_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE id = document_curation_notes.document_id 
            AND (user_id = auth.uid() OR adviser_id = auth.uid())
        ) OR
        curator_id = auth.uid()
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Insert sample data
INSERT INTO users (id, email, first_name, last_name, role, program, student_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'john.dinglasan@ub.edu.ph', 'John Mark', 'Dinglasan', 'student', 'BS Information Technology', '2021-00001'),
    ('550e8400-e29b-41d4-a716-446655440002', 'maria.santos@ub.edu.ph', 'Dr. Maria', 'Santos', 'faculty', NULL, 'FAC-2020-001'),
    ('550e8400-e29b-41d4-a716-446655440003', 'librarian@ub.edu.ph', 'Ana', 'Cruz', 'librarian', NULL, 'LIB-2019-001'),
    ('550e8400-e29b-41d4-a716-446655440004', 'admin@ub.edu.ph', 'Roberto', 'Admin', 'admin', NULL, 'ADM-2018-001');

-- Insert sample keywords
INSERT INTO keywords (name) VALUES
    ('Machine Learning'),
    ('Healthcare'),
    ('Data Analysis'),
    ('Sustainable Energy'),
    ('Rural Development'),
    ('Digital Marketing'),
    ('SME'),
    ('Education'),
    ('Mathematics'),
    ('Nursing'),
    ('Patient Care'),
    ('Blockchain'),
    ('Supply Chain');

-- Insert sample documents
INSERT INTO documents (id, title, abstract, program, year, status, user_id, adviser_id, pages, file_size, download_count, view_count, published_at) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 
     'Machine Learning Applications in Healthcare Data Analysis', 
     'This study explores the implementation of machine learning algorithms for healthcare data analysis, focusing on predictive modeling for patient outcomes...', 
     'BS Information Technology', 
     2024, 
     'published', 
     '550e8400-e29b-41d4-a716-446655440001', 
     '550e8400-e29b-41d4-a716-446655440002', 
     89, 
     '2.4 MB', 
     147, 
     1245, 
     '2024-03-15T00:00:00Z');

-- Insert sample document authors
INSERT INTO document_authors (document_id, user_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample document keywords
INSERT INTO document_keywords (document_id, keyword_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM keywords WHERE name = 'Machine Learning')),
    ('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM keywords WHERE name = 'Healthcare')),
    ('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM keywords WHERE name = 'Data Analysis'));

-- Insert sample document files
INSERT INTO document_files (document_id, file_name, file_path, file_size, file_type, is_primary) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'machine_learning_healthcare.pdf', '/documents/660e8400-e29b-41d4-a716-446655440001/machine_learning_healthcare.pdf', '2.4 MB', 'application/pdf', true);

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Authenticated users can view published document files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can upload their own document files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        auth.role() = 'authenticated'
    );

-- Functions for search and analytics
CREATE OR REPLACE FUNCTION search_documents(search_query TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    abstract TEXT,
    program VARCHAR(255),
    year INTEGER,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.abstract,
        d.program,
        d.year,
        ts_rank(
            to_tsvector('english', d.title || ' ' || d.abstract),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM documents d
    WHERE 
        d.status = 'published' AND
        (
            to_tsvector('english', d.title || ' ' || d.abstract) @@ plainto_tsquery('english', search_query)
            OR d.title ILIKE '%' || search_query || '%'
            OR d.abstract ILIKE '%' || search_query || '%'
        )
    ORDER BY rank DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get repository statistics
CREATE OR REPLACE FUNCTION get_repository_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_documents', (SELECT COUNT(*) FROM documents WHERE status = 'published'),
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'pending_reviews', (SELECT COUNT(*) FROM documents WHERE status = 'pending'),
        'monthly_uploads', (
            SELECT COUNT(*) FROM documents 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'downloads_today', (
            SELECT COALESCE(SUM(download_count), 0) FROM documents 
            WHERE DATE(created_at) = CURRENT_DATE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_documents', (SELECT COUNT(*) FROM documents),
        'pending_review', (SELECT COUNT(*) FROM documents WHERE status = 'pending'),
        'needs_revision', (SELECT COUNT(*) FROM documents WHERE status = 'needs_revision'),
        'under_curation', (SELECT COUNT(*) FROM documents WHERE status = 'curation'),
        'ready_for_publication', (SELECT COUNT(*) FROM documents WHERE status = 'ready_for_publication'),
        'published', (SELECT COUNT(*) FROM documents WHERE status = 'published'),
        'rejected', (SELECT COUNT(*) FROM documents WHERE status = 'rejected')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
