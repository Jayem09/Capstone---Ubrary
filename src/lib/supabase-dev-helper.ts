// Development helper for Supabase operations that bypass RLS
// This is only for development and should not be used in production

import { supabase } from './supabase'

export const devSupabaseHelpers = {
  // Create document without RLS restrictions (development only)
  async createDocumentDev(document: {
    title: string
    abstract: string
    program: string
    year: number
    user_id: string
    adviser_id?: string
    adviser_name?: string
    keywords: string[]
    authors: string[]
  }) {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      // First, try to create the document directly
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          title: document.title,
          abstract: document.abstract,
          program: document.program,
          year: document.year,
          user_id: document.user_id,
          adviser_id: document.adviser_id || document.user_id, // Use user as their own adviser if not specified
          status: 'pending',
          author_names: document.authors.length > 0 ? document.authors.join(', ') : null,
          adviser_name: document.adviser_name || null
        })
        .select()
        .single()

      if (docError) {
        console.error('Error creating document:', docError)
        return { data: null, error: docError }
      }

      // Insert keywords if provided
      if (document.keywords.length > 0) {
        try {
          // First, try to get existing keywords
          const { data: existingKeywords } = await supabase
            .from('keywords')
            .select('id, name')
            .in('name', document.keywords)

          const existingKeywordNames = existingKeywords?.map(k => k.name) || []
          const newKeywords = document.keywords.filter(name => !existingKeywordNames.includes(name))

          let allKeywords = existingKeywords || []

          // Insert new keywords if any
          if (newKeywords.length > 0) {
            const { data: insertedKeywords, error: keywordError } = await supabase
              .from('keywords')
              .insert(newKeywords.map(name => ({ name })))
              .select()

            if (keywordError) {
              console.warn('Error inserting new keywords:', keywordError)
            } else if (insertedKeywords) {
              allKeywords = [...allKeywords, ...insertedKeywords]
            }
          }

          // Link all keywords to document
          if (allKeywords.length > 0 && doc) {
            const { error: linkError } = await supabase
              .from('document_keywords')
              .insert(
                allKeywords.map(keyword => ({
                  document_id: doc.id,
                  keyword_id: keyword.id
                }))
              )

            if (linkError) {
              console.warn('Error linking keywords to document:', linkError)
            }
          }
        } catch (error) {
          console.warn('Error processing keywords:', error)
        }
      }

      // Authors and adviser are now stored as text fields, no need for complex linking
      if (document.authors.length > 0) {
        console.log('✅ Authors stored as text:', document.authors.join(', '))
      } else {
        console.log('📝 No authors provided, author_names field will be null')
      }
      
      if (document.adviser_name) {
        console.log('✅ Adviser stored as text:', document.adviser_name)
      } else {
        console.log('📝 No adviser provided, adviser_name field will be null')
      }

      return { data: doc, error: null }
    } catch (error) {
      console.error('Error in createDocumentDev:', error)
      return { data: null, error }
    }
  },

  // Get documents without RLS restrictions (development only)
  async getDocumentsDev(options?: {
    includeUnpublished?: boolean
    userId?: string
  }) {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          adviser:users!adviser_id(id, first_name, last_name, email),
          keywords:document_keywords(
            keywords(id, name)
          ),
          files:document_files(*)
        `)

      // For "My Uploads", show all user documents regardless of status
      if (options?.userId && options?.includeUnpublished) {
        query = query.eq('user_id', options.userId)
      } 
      // For "All Documents", only show published documents
      else if (options?.userId) {
        query = query.eq('user_id', options.userId).eq('status', 'published')
      } 
      // For general document listing, only show published
      else {
        query = query.eq('status', 'published')
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      console.error('Error in getDocumentsDev:', error)
      return { data: null, error }
    }
  },

  // Get users without RLS restrictions (development only)
  async getUsersDev() {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error in getUsersDev:', error)
      return { data: null, error }
    }
  },

  // Upload file without RLS restrictions (development only)
  async uploadFileDev(file: File, path: string) {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file)

      return { data, error }
    } catch (error) {
      console.error('Error in uploadFileDev:', error)
      return { data: null, error }
    }
  },

  // Save file metadata without RLS restrictions (development only)
  async saveFileMetadataDev(fileMetadata: {
    document_id: string
    file_name: string
    file_path: string
    file_size: string
    file_type: string
    is_primary?: boolean
  }) {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      const { data, error } = await supabase
        .from('document_files')
        .insert(fileMetadata)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error in saveFileMetadataDev:', error)
      return { data: null, error }
    }
  },

  // Get document file path from database (development only)
  async getDocumentFilePathDev(documentId: string) {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      const { data, error } = await supabase
        .from('document_files')
        .select('file_path, file_name')
        .eq('document_id', documentId)
        .eq('is_primary', true)
        .single()

      if (error) {
        console.error('Error getting document file path (dev):', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getDocumentFilePathDev:', error)
      return { data: null, error }
    }
  }
}
