import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/supabase'

// Create a development Supabase client that can bypass RLS for testing
export const supabaseDev = createClient(
  supabaseConfig.getUrl(),
  supabaseConfig.getAnonKey(),
  {
    auth: {
      // Disable auto-refresh for development
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        // Add a custom header to identify development requests
        'X-Client-Info': 'ubrary-dev'
      }
    }
  }
)

// Helper function to create documents with RLS bypass for development
export const createDocumentDev = async (documentData: {
  title: string
  abstract: string
  program: string
  year: number
  user_id: string
  adviser_id: string
  keywords: string[]
  authors: string[]
}) => {
  try {
    // First, ensure the user exists in the database
    const { data: existingUser } = await supabaseDev
      .from('users')
      .select('id')
      .eq('id', documentData.user_id)
      .single()

    if (!existingUser) {
      // Create a basic user record for development
      const { error: userError } = await supabaseDev
        .from('users')
        .insert({
          id: documentData.user_id,
          email: `dev-user-${documentData.user_id}@example.com`,
          first_name: 'Dev',
          last_name: 'User',
          role: 'student',
          is_active: true
        })

      if (userError) {
        console.warn('Could not create dev user:', userError)
      }
    }

    // Ensure adviser exists
    const { data: existingAdviser } = await supabaseDev
      .from('users')
      .select('id')
      .eq('id', documentData.adviser_id)
      .single()

    if (!existingAdviser) {
      // Create a basic adviser record for development
      const { error: adviserError } = await supabaseDev
        .from('users')
        .insert({
          id: documentData.adviser_id,
          email: `dev-adviser-${documentData.adviser_id}@example.com`,
          first_name: 'Dev',
          last_name: 'Adviser',
          role: 'faculty',
          is_active: true
        })

      if (adviserError) {
        console.warn('Could not create dev adviser:', adviserError)
      }
    }

    // Create the document using RPC to bypass RLS
    const { data, error } = await supabaseDev.rpc('create_document_dev', {
      p_title: documentData.title,
      p_abstract: documentData.abstract,
      p_program: documentData.program,
      p_year: documentData.year,
      p_user_id: documentData.user_id,
      p_adviser_id: documentData.adviser_id,
      p_keywords: documentData.keywords,
      p_authors: documentData.authors
    })

    if (error) {
      // Fallback: try direct insert (might fail due to RLS)
      const { data: fallbackData, error: fallbackError } = await supabaseDev
        .from('documents')
        .insert({
          title: documentData.title,
          abstract: documentData.abstract,
          program: documentData.program,
          year: documentData.year,
          user_id: documentData.user_id,
          adviser_id: documentData.adviser_id,
          status: 'pending'
        })
        .select()
        .single()

      if (fallbackError) {
        throw fallbackError
      }

      return { data: fallbackData, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createDocumentDev:', error)
    return { data: null, error }
  }
}
