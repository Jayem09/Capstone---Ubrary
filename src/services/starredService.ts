import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export class StarredService {
  // Toggle starred status for a document
  static async toggleStar(documentId: string): Promise<{ isStarred: boolean; error?: any }> {
    try {
      const { data, error } = await supabase.rpc('toggle_document_star', {
        document_id_param: documentId
      })

      if (error) {
        // If function doesn't exist yet, show helpful message
        if (error.code === 'PGRST202' || error.message?.includes('toggle_document_star')) {
          toast.error('Starred functionality not yet set up. Please run the database setup script.')
          return { isStarred: false, error }
        }
        console.error('Error toggling star:', error)
        toast.error('Failed to update starred status')
        return { isStarred: false, error }
      }

      const isStarred = data as boolean
      toast.success(isStarred ? 'Document starred!' : 'Document unstarred!')
      return { isStarred }
    } catch (error) {
      console.error('Error in toggleStar:', error)
      toast.error('An unexpected error occurred')
      return { isStarred: false, error }
    }
  }

  // Check if document is starred by current user
  static async isDocumentStarred(documentId: string): Promise<boolean> {
    try {
      // Temporarily disabled to avoid 406 errors
      console.log('🔧 Starred functionality temporarily disabled to avoid 406 errors')
      return false
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return false

      const { data, error } = await supabase
        .from('starred_documents')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', user.user.id)
        .single()

      if (error) {
        // Handle 406 Not Acceptable error (RLS policy issue)
        if (error.code === 'PGRST301' || (error as any).status === 406) {
          console.warn('RLS policy issue with starred_documents - returning false')
          return false
        }
        // If table doesn't exist yet, return false silently
        if (error.code === 'PGRST205' || error.message?.includes('starred_documents')) {
          return false
        }
        // If no data found, return false
        if (error.code === 'PGRST116') {
          return false
        }
        console.error('Error checking starred status:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in isDocumentStarred:', error)
      return false
    }
  }

  // Get user's starred documents
  static async getStarredDocuments(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase.rpc('get_starred_documents', {
        limit_param: limit,
        offset_param: offset
      })

      if (error) {
        // Handle 406 Not Acceptable error (RLS policy issue)
        if (error.code === 'PGRST301' || (error as any).status === 406) {
          console.warn('RLS policy issue with starred documents - returning empty array')
          return { data: [], error: null }
        }
        // If function doesn't exist yet, return empty array silently
        if (error.code === 'PGRST202' || error.message?.includes('get_starred_documents')) {
          return { data: [], error: null }
        }
        console.error('Error fetching starred documents:', error)
        toast.error('Failed to load starred documents')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getStarredDocuments:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Get starred documents count for current user
  static async getStarredCount(): Promise<number> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return 0

      const { count, error } = await supabase
        .from('starred_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)

      if (error) {
        // Handle 406 Not Acceptable error (RLS policy issue)
        if (error.code === 'PGRST301' || (error as any).status === 406) {
          console.warn('RLS policy issue with starred documents count - returning 0')
          return 0
        }
        // If table doesn't exist yet, return 0 silently
        if (error.code === 'PGRST205' || error.message?.includes('starred_documents')) {
          return 0
        }
        console.error('Error getting starred count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getStarredCount:', error)
      return 0
    }
  }

  // Get multiple documents' starred status
  static async getDocumentsStarredStatus(documentIds: string[]): Promise<Record<string, boolean>> {
    try {
      // Temporarily disabled to avoid 406 errors
      console.log('🔧 Starred status check temporarily disabled to avoid 406 errors')
      const emptyMap: Record<string, boolean> = {}
      documentIds.forEach(id => {
        emptyMap[id] = false
      })
      return emptyMap
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return {}

      const { data, error } = await supabase
        .from('starred_documents')
        .select('document_id')
        .eq('user_id', user.user.id)
        .in('document_id', documentIds)

      if (error) {
        // Handle 406 Not Acceptable error (RLS policy issue)
        if (error.code === 'PGRST301' || (error as any).status === 406) {
          console.warn('RLS policy issue with starred documents status - returning empty map')
          const emptyMap: Record<string, boolean> = {}
          documentIds.forEach(id => {
            emptyMap[id] = false
          })
          return emptyMap
        }
        // If table doesn't exist yet, return empty map silently
        if (error.code === 'PGRST205' || error.message?.includes('starred_documents')) {
          const emptyMap: Record<string, boolean> = {}
          documentIds.forEach(id => {
            emptyMap[id] = false
          })
          return emptyMap
        }
        console.error('Error getting starred status:', error)
        return {}
      }

      const starredMap: Record<string, boolean> = {}
      documentIds.forEach(id => {
        starredMap[id] = false
      })

      if (data) {
        data.forEach(item => {
          starredMap[item.document_id] = true
        })
      }

      return starredMap
    } catch (error) {
      console.error('Error in getDocumentsStarredStatus:', error)
      return {}
    }
  }
}
