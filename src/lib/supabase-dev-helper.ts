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
          status: 'pending'
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

      // Insert authors if provided
      if (document.authors.length > 0) {
        try {
          // Find users by email
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .in('email', document.authors)

          if (userError) {
            console.warn('Error finding authors:', userError)
          } else if (users && doc) {
            // Link authors to document
            await supabase
              .from('document_authors')
              .insert(
                users.map(user => ({
                  document_id: doc.id,
                  user_id: user.id
                }))
              )
          }
        } catch (error) {
          console.warn('Error processing authors:', error)
        }
      }

      return { data: doc, error: null }
    } catch (error) {
      console.error('Error in createDocumentDev:', error)
      return { data: null, error }
    }
  },

  // Get documents without RLS restrictions (development only)
  async getDocumentsDev() {
    if (import.meta.env.PROD) {
      throw new Error('Development helpers should not be used in production')
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          authors:document_authors(
            users(id, first_name, last_name, email)
          ),
          adviser:users!adviser_id(id, first_name, last_name, email),
          keywords:document_keywords(
            keywords(id, name)
          ),
          files:document_files(*)
        `)
        .order('created_at', { ascending: false })

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
