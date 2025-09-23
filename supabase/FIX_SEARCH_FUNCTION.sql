-- Fix Search Function - Safe Update
-- This safely updates the search function without breaking existing functionality

-- Step 1: Drop existing function safely
DROP FUNCTION IF EXISTS search_documents(text) CASCADE;

-- Step 2: Create improved search function with same signature for compatibility
CREATE OR REPLACE FUNCTION search_documents(search_query TEXT)
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
  SELECT DISTINCT
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
  WHERE d.status = 'published' -- Only search published documents
    AND (
      -- Search in all document metadata fields
      d.title ILIKE '%' || search_query || '%' OR
      d.abstract ILIKE '%' || search_query || '%' OR
      d.program ILIKE '%' || search_query || '%' OR
      d.author_names ILIKE '%' || search_query || '%' OR
      d.adviser_name ILIKE '%' || search_query || '%' OR
      d.year::TEXT = search_query OR
      -- Search in keywords
      EXISTS (
        SELECT 1 
        FROM document_keywords dk 
        JOIN keywords k ON dk.keyword_id = k.id 
        WHERE dk.document_id = d.id 
          AND k.name ILIKE '%' || search_query || '%'
      )
    )
  -- Order by relevance (title matches first, then others)
  ORDER BY 
    CASE 
      WHEN d.title ILIKE '%' || search_query || '%' THEN 1
      WHEN d.abstract ILIKE '%' || search_query || '%' THEN 2
      WHEN d.program ILIKE '%' || search_query || '%' THEN 3
      WHEN d.author_names ILIKE '%' || search_query || '%' THEN 4
      WHEN d.adviser_name ILIKE '%' || search_query || '%' THEN 5
      ELSE 6
    END,
    d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION search_documents(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents(text) TO anon;

-- Step 4: Create indexes for better search performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_documents_title_gin ON documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_abstract_gin ON documents USING gin(abstract gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_program_gin ON documents USING gin(program gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_author_names_gin ON documents USING gin(author_names gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_adviser_name_gin ON documents USING gin(adviser_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_keywords_name_gin ON keywords USING gin(name gin_trgm_ops);

-- Step 5: Test the function
SELECT 'Enhanced search function updated successfully!' as status;

-- Example usage:
-- SELECT * FROM search_documents('information technology');
-- SELECT * FROM search_documents('machine learning');
-- SELECT * FROM search_documents('2024');
