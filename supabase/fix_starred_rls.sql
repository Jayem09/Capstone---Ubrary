-- Fix RLS policies for starred_documents table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own starred documents" ON starred_documents;
DROP POLICY IF EXISTS "Users can star documents" ON starred_documents;  
DROP POLICY IF EXISTS "Users can unstar documents" ON starred_documents;

-- Create more permissive policies that work better with UUID comparison
CREATE POLICY "Users can view own starred documents" ON starred_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can star documents" ON starred_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar documents" ON starred_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Also create a more permissive policy for development
CREATE POLICY "Allow authenticated users to read starred documents" ON starred_documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies for starred_documents fixed!' as status;
