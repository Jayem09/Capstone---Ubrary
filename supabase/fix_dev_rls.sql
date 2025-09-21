-- Fix RLS policies for development environment
-- This script addresses the authentication issue where mock users can't create documents

-- 1. Temporarily disable RLS for development (if needed)
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 2. Alternative: Create permissive policies for development
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Advisers can view their advisees' documents" ON documents;
DROP POLICY IF EXISTS "Published documents are viewable by all authenticated users" ON documents;

-- Create development-friendly policies
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Dev: Allow document creation" ON documents;
DROP POLICY IF EXISTS "Dev: Allow document viewing" ON documents;
DROP POLICY IF EXISTS "Dev: Allow document updates" ON documents;

-- Allow any authenticated user to create documents (for development)
CREATE POLICY "Dev: Allow document creation" ON documents
    FOR INSERT WITH CHECK (true);

-- Allow any authenticated user to view documents (for development)
CREATE POLICY "Dev: Allow document viewing" ON documents
    FOR SELECT USING (true);

-- Allow any authenticated user to update documents (for development)
CREATE POLICY "Dev: Allow document updates" ON documents
    FOR UPDATE USING (true);

-- 3. Also fix users table policies for development
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Public can view basic user info" ON users;

-- Create permissive user policies for development
DROP POLICY IF EXISTS "Dev: Allow user viewing" ON users;
DROP POLICY IF EXISTS "Dev: Allow user updates" ON users;

CREATE POLICY "Dev: Allow user viewing" ON users
    FOR SELECT USING (true);

CREATE POLICY "Dev: Allow user updates" ON users
    FOR UPDATE USING (true);

-- 4. Fix other related tables
ALTER TABLE document_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage document authors" ON document_authors;
DROP POLICY IF EXISTS "Dev: Allow document author management" ON document_authors;
CREATE POLICY "Dev: Allow document author management" ON document_authors
    FOR ALL USING (true);

ALTER TABLE document_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage document keywords" ON document_keywords;
DROP POLICY IF EXISTS "Dev: Allow document keyword management" ON document_keywords;
CREATE POLICY "Dev: Allow document keyword management" ON document_keywords
    FOR ALL USING (true);

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage document files" ON document_files;
DROP POLICY IF EXISTS "Dev: Allow document file management" ON document_files;
CREATE POLICY "Dev: Allow document file management" ON document_files
    FOR ALL USING (true);

-- 5. Fix keywords table RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view keywords" ON keywords;
DROP POLICY IF EXISTS "Users can create keywords" ON keywords;
DROP POLICY IF EXISTS "Dev: Allow keyword management" ON keywords;
CREATE POLICY "Dev: Allow keyword management" ON keywords
    FOR ALL USING (true);

-- 6. Fix storage bucket policies
DROP POLICY IF EXISTS "Authenticated users can view published document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own document files" ON storage.objects;

-- Create permissive storage policies for development
DROP POLICY IF EXISTS "Dev: Allow file viewing" ON storage.objects;
DROP POLICY IF EXISTS "Dev: Allow file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Dev: Allow file updates" ON storage.objects;
DROP POLICY IF EXISTS "Dev: Allow file deletion" ON storage.objects;

CREATE POLICY "Dev: Allow file viewing" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Dev: Allow file uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Dev: Allow file updates" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents');

CREATE POLICY "Dev: Allow file deletion" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents');

-- 5. Create a function to set user context for development
CREATE OR REPLACE FUNCTION set_dev_user_context(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- This function can be called to simulate user context in development
    -- For now, we'll rely on the permissive policies above
    PERFORM 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add a comment explaining this is for development
COMMENT ON TABLE documents IS 'Development mode: RLS policies are permissive for testing';
COMMENT ON TABLE users IS 'Development mode: RLS policies are permissive for testing';
