-- Additional SQL functions for UBrary Supabase integration

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(document_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE documents 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(document_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE documents 
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document statistics by program
CREATE OR REPLACE FUNCTION get_program_stats()
RETURNS TABLE (
    program VARCHAR(255),
    document_count BIGINT,
    total_downloads BIGINT,
    avg_downloads NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.program,
        COUNT(d.id) as document_count,
        SUM(d.download_count) as total_downloads,
        AVG(d.download_count) as avg_downloads
    FROM documents d
    WHERE d.status = 'published'
    GROUP BY d.program
    ORDER BY total_downloads DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly upload statistics
CREATE OR REPLACE FUNCTION get_monthly_upload_stats(months_back INTEGER DEFAULT 12)
RETURNS TABLE (
    month_year TEXT,
    upload_count BIGINT,
    publish_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(date_trunc('month', d.created_at), 'YYYY-MM') as month_year,
        COUNT(d.id) as upload_count,
        COUNT(CASE WHEN d.status = 'published' THEN 1 END) as publish_count
    FROM documents d
    WHERE d.created_at >= NOW() - INTERVAL '1 month' * months_back
    GROUP BY date_trunc('month', d.created_at)
    ORDER BY month_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top downloaded documents
CREATE OR REPLACE FUNCTION get_top_documents(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    download_count INTEGER,
    view_count INTEGER,
    author_names TEXT,
    program VARCHAR(255),
    year INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.download_count,
        d.view_count,
        STRING_AGG(u.first_name || ' ' || u.last_name, ', ') as author_names,
        d.program,
        d.year
    FROM documents d
    LEFT JOIN document_authors da ON d.id = da.document_id
    LEFT JOIN users u ON da.user_id = u.id
    WHERE d.status = 'published'
    GROUP BY d.id, d.title, d.download_count, d.view_count, d.program, d.year
    ORDER BY d.download_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_documents', (
            SELECT COUNT(*) FROM documents 
            WHERE user_id = user_id_param
        ),
        'published_documents', (
            SELECT COUNT(*) FROM documents 
            WHERE user_id = user_id_param AND status = 'published'
        ),
        'pending_documents', (
            SELECT COUNT(*) FROM documents 
            WHERE user_id = user_id_param AND status = 'pending'
        ),
        'total_downloads', (
            SELECT COALESCE(SUM(download_count), 0) FROM documents 
            WHERE user_id = user_id_param AND status = 'published'
        ),
        'total_views', (
            SELECT COALESCE(SUM(view_count), 0) FROM documents 
            WHERE user_id = user_id_param AND status = 'published'
        ),
        'recent_activity', (
            SELECT json_agg(
                json_build_object(
                    'action', action,
                    'resource_type', resource_type,
                    'created_at', created_at
                )
            )
            FROM audit_logs 
            WHERE user_id = user_id_param::text
            ORDER BY created_at DESC 
            LIMIT 10
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search documents with ranking
CREATE OR REPLACE FUNCTION advanced_search_documents(
    search_query TEXT,
    program_filter VARCHAR(255) DEFAULT NULL,
    year_filter INTEGER DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    abstract TEXT,
    program VARCHAR(255),
    year INTEGER,
    author_names TEXT,
    keyword_names TEXT,
    download_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
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
        STRING_AGG(DISTINCT u.first_name || ' ' || u.last_name, ', ') as author_names,
        STRING_AGG(DISTINCT k.name, ', ') as keyword_names,
        d.download_count,
        d.view_count,
        d.created_at,
        GREATEST(
            ts_rank(to_tsvector('english', d.title), plainto_tsquery('english', search_query)) * 2,
            ts_rank(to_tsvector('english', d.abstract), plainto_tsquery('english', search_query)),
            similarity(d.title, search_query) * 1.5,
            similarity(d.abstract, search_query)
        ) as rank
    FROM documents d
    LEFT JOIN document_authors da ON d.id = da.document_id
    LEFT JOIN users u ON da.user_id = u.id
    LEFT JOIN document_keywords dk ON d.id = dk.document_id
    LEFT JOIN keywords k ON dk.keyword_id = k.id
    WHERE 
        d.status = 'published' AND
        (
            to_tsvector('english', d.title || ' ' || d.abstract) @@ plainto_tsquery('english', search_query)
            OR d.title ILIKE '%' || search_query || '%'
            OR d.abstract ILIKE '%' || search_query || '%'
            OR similarity(d.title, search_query) > 0.3
            OR similarity(d.abstract, search_query) > 0.1
        ) AND
        (program_filter IS NULL OR d.program = program_filter) AND
        (year_filter IS NULL OR d.year = year_filter)
    GROUP BY d.id, d.title, d.abstract, d.program, d.year, d.download_count, d.view_count, d.created_at
    HAVING GREATEST(
        ts_rank(to_tsvector('english', d.title), plainto_tsquery('english', search_query)) * 2,
        ts_rank(to_tsvector('english', d.abstract), plainto_tsquery('english', search_query)),
        similarity(d.title, search_query) * 1.5,
        similarity(d.abstract, search_query)
    ) > 0
    ORDER BY rank DESC, d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending documents (most downloaded in last 30 days)
CREATE OR REPLACE FUNCTION get_trending_documents(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    program VARCHAR(255),
    download_count INTEGER,
    recent_downloads BIGINT,
    author_names TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.program,
        d.download_count,
        COUNT(al.id) as recent_downloads,
        STRING_AGG(DISTINCT u.first_name || ' ' || u.last_name, ', ') as author_names
    FROM documents d
    LEFT JOIN audit_logs al ON d.id::text = al.resource_id AND al.action = 'document_download'
        AND al.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN document_authors da ON d.id = da.document_id
    LEFT JOIN users u ON da.user_id = u.id
    WHERE d.status = 'published'
    GROUP BY d.id, d.title, d.program, d.download_count
    ORDER BY recent_downloads DESC, d.download_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get similar documents based on keywords
CREATE OR REPLACE FUNCTION get_similar_documents(document_id_param UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    title TEXT,
    program VARCHAR(255),
    similarity_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.program,
        COUNT(DISTINCT dk2.keyword_id) as similarity_score
    FROM documents d
    JOIN document_keywords dk2 ON d.id = dk2.document_id
    WHERE d.id != document_id_param 
        AND d.status = 'published'
        AND dk2.keyword_id IN (
            SELECT dk1.keyword_id 
            FROM document_keywords dk1 
            WHERE dk1.document_id = document_id_param
        )
    GROUP BY d.id, d.title, d.program
    ORDER BY similarity_score DESC, d.download_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
