-- Comprehensive Search Function for UBrary
-- This function provides full-text search across all document metadata including keywords

-- First, drop existing search functions to avoid conflicts
DROP FUNCTION IF EXISTS search_documents(text);
DROP FUNCTION IF EXISTS search_documents_comprehensive(text);

-- Create a function to search documents with all metadata
CREATE OR REPLACE FUNCTION search_documents_comprehensive(search_query TEXT)
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
  keywords TEXT[], -- Array of matching keywords
  relevance_score FLOAT -- Search relevance score
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
    d.published_at,
    -- Aggregate keywords that match
    ARRAY(
      SELECT k.name 
      FROM document_keywords dk 
      JOIN keywords k ON dk.keyword_id = k.id 
      WHERE dk.document_id = d.id 
        AND k.name ILIKE '%' || search_query || '%'
    ) as keywords,
    -- Calculate relevance score based on field matches
    (
      CASE WHEN d.title ILIKE '%' || search_query || '%' THEN 5.0 ELSE 0.0 END +
      CASE WHEN d.abstract ILIKE '%' || search_query || '%' THEN 3.0 ELSE 0.0 END +
      CASE WHEN d.program ILIKE '%' || search_query || '%' THEN 2.0 ELSE 0.0 END +
      CASE WHEN d.author_names ILIKE '%' || search_query || '%' THEN 2.0 ELSE 0.0 END +
      CASE WHEN d.adviser_name ILIKE '%' || search_query || '%' THEN 2.0 ELSE 0.0 END +
      CASE WHEN d.year::TEXT = search_query THEN 1.0 ELSE 0.0 END +
      -- Add keyword match score
      (SELECT COUNT(*)::FLOAT * 1.5 
       FROM document_keywords dk 
       JOIN keywords k ON dk.keyword_id = k.id 
       WHERE dk.document_id = d.id 
         AND k.name ILIKE '%' || search_query || '%')
    ) as relevance_score
  FROM documents d
  WHERE d.status = 'published' -- Only search published documents
    AND (
      -- Search in document fields
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
  ORDER BY relevance_score DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_documents_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents_comprehensive TO anon;

-- Create a simpler version for basic search (backward compatibility)
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
    d.published_at
  FROM search_documents_comprehensive(search_query) d
  ORDER BY d.relevance_score DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for backward compatibility
GRANT EXECUTE ON FUNCTION search_documents TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents TO anon;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_title_gin ON documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_abstract_gin ON documents USING gin(abstract gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_program_gin ON documents USING gin(program gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_author_names_gin ON documents USING gin(author_names gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_adviser_name_gin ON documents USING gin(adviser_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_keywords_name_gin ON keywords USING gin(name gin_trgm_ops);

-- Test the function
SELECT 'Comprehensive search function created successfully!' as status;

-- Example usage:
-- SELECT * FROM search_documents_comprehensive('information technology');
-- SELECT * FROM search_documents('machine learning');
