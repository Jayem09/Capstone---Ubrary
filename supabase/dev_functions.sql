-- Development functions to bypass RLS for testing
-- These functions should only be used in development environment

-- Function to create documents with RLS bypass
CREATE OR REPLACE FUNCTION create_document_dev(
  p_title TEXT,
  p_abstract TEXT,
  p_program VARCHAR(255),
  p_year INTEGER,
  p_user_id UUID,
  p_adviser_id UUID,
  p_keywords TEXT[],
  p_authors TEXT[]
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  abstract TEXT,
  program VARCHAR(255),
  year INTEGER,
  status document_status,
  user_id UUID,
  adviser_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  new_doc_id UUID;
  keyword_record RECORD;
  author_email TEXT;
  author_user_id UUID;
BEGIN
  -- Generate new document ID
  new_doc_id := uuid_generate_v4();
  
  -- Insert the document (bypassing RLS due to SECURITY DEFINER)
  INSERT INTO documents (
    id,
    title,
    abstract,
    program,
    year,
    status,
    user_id,
    adviser_id,
    created_at
  ) VALUES (
    new_doc_id,
    p_title,
    p_abstract,
    p_program,
    p_year,
    'pending',
    p_user_id,
    p_adviser_id,
    NOW()
  );
  
  -- Insert keywords
  IF p_keywords IS NOT NULL AND array_length(p_keywords, 1) > 0 THEN
    -- First, insert keywords that don't exist
    INSERT INTO keywords (name)
    SELECT unnest(p_keywords)
    ON CONFLICT (name) DO NOTHING;
    
    -- Then link keywords to document
    INSERT INTO document_keywords (document_id, keyword_id)
    SELECT new_doc_id, k.id
    FROM keywords k
    WHERE k.name = ANY(p_keywords);
  END IF;
  
  -- Insert authors
  IF p_authors IS NOT NULL AND array_length(p_authors, 1) > 0 THEN
    FOREACH author_email IN ARRAY p_authors
    LOOP
      -- Try to find existing user by email
      SELECT id INTO author_user_id
      FROM users
      WHERE email = author_email;
      
      -- If user doesn't exist, create a basic user record
      IF author_user_id IS NULL THEN
        INSERT INTO users (
          id,
          email,
          first_name,
          last_name,
          role,
          is_active
        ) VALUES (
          uuid_generate_v4(),
          author_email,
          'Author',
          'User',
          'student',
          true
        ) RETURNING id INTO author_user_id;
      END IF;
      
      -- Link author to document
      INSERT INTO document_authors (document_id, user_id)
      VALUES (new_doc_id, author_user_id)
      ON CONFLICT (document_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  
  -- Return the created document
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.abstract,
    d.program,
    d.year,
    d.status,
    d.user_id,
    d.adviser_id,
    d.created_at
  FROM documents d
  WHERE d.id = new_doc_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_document_dev TO authenticated;
GRANT EXECUTE ON FUNCTION create_document_dev TO anon;
