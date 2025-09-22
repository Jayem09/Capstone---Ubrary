import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/supabase'

// Create Supabase client with proper configuration
export const supabase = createClient(
  supabaseConfig.getUrl(),
  supabaseConfig.getAnonKey(),
  {
    auth: {
      // Always enable these for better UX - no more session clearing needed!
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Always use localStorage for session persistence
      storage: window.localStorage,
      // Set longer session timeout
      storageKey: 'ubrary-auth-token'
    }
  }
)

// Log configuration status in development
if (import.meta.env.DEV) {
  const status = supabaseConfig.isConfigured()
  console.log('🔧 Supabase Configuration:', status ? '✅ Configured' : '⚠️ Using fallback values')
  if (!status) {
    console.log('📝 To configure Supabase:')
    console.log('1. Create a .env.local file in your project root')
    console.log('2. Add your Supabase URL and anon key:')
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key')
  }
}

// Helper functions for common database operations
export const supabaseHelpers = {
  // Documents
  async getDocuments(options?: {
    limit?: number
    offset?: number
    category?: string
    search?: string
    userId?: string
  }) {
    let query = supabase
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
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (options?.category && options.category !== 'all') {
      query = query.eq('program', options.category)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,abstract.ilike.%${options.search}%`)
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  },

  async getDocument(id: string) {
    return supabase
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
      .eq('id', id)
      .single()
  },

  async createDocument(document: {
    title: string
    abstract: string
    program: string
    year: number
    user_id: string
    adviser_id?: string
    keywords: string[]
    authors: string[]
  }) {
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        abstract: document.abstract,
        program: document.program,
        year: document.year,
        user_id: document.user_id,
        adviser_id: document.adviser_id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Insert keywords
    if (document.keywords.length > 0) {
      const { data: keywords } = await supabase
        .from('keywords')
        .upsert(document.keywords.map(name => ({ name })))
        .select()

      if (keywords) {
        await supabase
          .from('document_keywords')
          .insert(keywords.map(keyword => ({
            document_id: doc.id,
            keyword_id: keyword.id
          })))
      }
    }

    // Insert authors
    if (document.authors.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('email', document.authors)

      if (users) {
        await supabase
          .from('document_authors')
          .insert(users.map(user => ({
            document_id: doc.id,
            user_id: user.id
          })))
      }
    }

    return doc
  },

  async updateDocumentStatus(documentId: string, status: 'pending' | 'approved' | 'rejected' | 'published') {
    return supabase
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', documentId)
  },

  // Users
  async getUsers(role?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }

    return query
  },

  async createUser(user: {
    email: string
    first_name: string
    last_name: string
    role: string
    program?: string
    department?: string
    student_id?: string
    employee_id?: string
  }) {
    return supabase
      .from('users')
      .insert(user)
      .select()
      .single()
  },

  async updateUser(userId: string, updates: Partial<{
    first_name: string
    last_name: string
    role: string
    program: string
    department: string
    is_active: boolean
  }>) {
    return supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
  },

  // Analytics
  async getAnalytics() {
    const [
      { count: totalDocuments },
      { count: totalUsers },
      { count: pendingReviews },
      { count: monthlyUploads }
    ] = await Promise.all([
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('documents').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    return {
      totalDocuments: totalDocuments || 0,
      totalUsers: totalUsers || 0,
      pendingReviews: pendingReviews || 0,
      monthlyUploads: monthlyUploads || 0
    }
  },

  // File operations
  async uploadFile(file: File, path: string) {
    return supabase.storage
      .from('documents')
      .upload(path, file)
  },

  async getFileUrl(path: string) {
    return supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600) // 1 hour expiry
  },

  async deleteFile(path: string) {
    return supabase.storage
      .from('documents')
      .remove([path])
  }
}
