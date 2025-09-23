import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export type DocumentStatus = 'pending' | 'under_review' | 'needs_revision' | 'approved' | 'curation' | 'ready_for_publication' | 'published' | 'rejected'
export type ReviewType = 'initial' | 'revision' | 'final'
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

export interface DocumentReview {
  id: string
  document_id: string
  reviewer_id: string
  review_type: ReviewType
  status: ReviewStatus
  comments?: string
  recommendations?: string
  score?: number
  is_approved?: boolean
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface WorkflowHistory {
  id: string
  document_id: string
  from_status?: DocumentStatus
  to_status: DocumentStatus
  changed_by: string
  reason?: string
  comments?: string
  created_at: string
}

export interface RevisionRequest {
  id: string
  document_id: string
  requested_by: string
  requested_from: string
  reason: string
  specific_requirements?: string
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CurationNote {
  id: string
  document_id: string
  curator_id: string
  note_type: 'metadata' | 'content' | 'formatting' | 'accessibility' | 'final_check'
  note: string
  is_resolved: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowStatus {
  document_id: string
  current_status: DocumentStatus
  submitted_at: string
  last_updated: string
  published_at?: string
  workflow_history: WorkflowHistory[]
  current_reviews: DocumentReview[]
  pending_revisions: RevisionRequest[]
}

export class WorkflowService {
  // Update document status with history tracking
  static async updateDocumentStatus(
    documentId: string,
    newStatus: DocumentStatus,
    changedBy: string,
    reason?: string,
    comments?: string
  ) {
    try {
      console.log('🔧 WorkflowService.updateDocumentStatus called with:', {
        documentId,
        newStatus,
        changedBy,
        reason,
        comments
      })

      // First, check if the RPC function exists by trying to call it
      const { data, error } = await supabase.rpc('update_document_status_with_history', {
        document_id_param: documentId,
        new_status: newStatus,
        changed_by_param: changedBy,
        reason_param: reason,
        comments_param: comments
      })

      console.log('📡 RPC call result:', { data, error })

      if (error) {
        console.error('❌ RPC Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })

        // If RPC function doesn't exist or has type issues, try direct update as fallback
        if (error.code === 'PGRST202' || 
            error.code === '42804' || // Type casting error
            error.message?.includes('function') || 
            error.message?.includes('does not exist') ||
            error.message?.includes('document_status') ||
            error.message?.includes('cast')) {
          
          console.log('🔄 RPC function issue detected, trying direct update fallback...', error.code)
          
          const { error: updateError } = await supabase
            .from('documents')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId)

          if (updateError) {
            console.error('❌ Direct update also failed:', updateError)
            toast.error('Failed to update document status')
            return { data: null, error: updateError }
          }

          console.log('✅ Direct update successful')
          toast.success(`Document status updated to ${newStatus}`)
          return { data: null, error: null }
        }

        toast.error('Failed to update document status')
        return { data: null, error }
      }

      const statusLabels = {
        pending: 'submitted for review',
        under_review: 'moved to review',
        needs_revision: 'marked for revision',
        approved: 'approved for curation',
        curation: 'moved to curation',
        ready_for_publication: 'ready for publication',
        published: 'approved and published - now visible to all users',
        rejected: 'rejected'
      }

      console.log('✅ Status update successful')
      toast.success(`Document ${statusLabels[newStatus]}`)
      return { data: null, error: null }
    } catch (error) {
      console.error('💥 Unexpected error in updateDocumentStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Get document workflow status
  static async getDocumentWorkflowStatus(documentId: string) {
    try {
      const { data, error } = await supabase.rpc('get_document_workflow_status', {
        document_id_param: documentId
      })

      if (error) {
        console.error('Error fetching workflow status:', error)
        toast.error('Failed to load workflow status')
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getDocumentWorkflowStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Get documents by workflow status for different user roles
  static async getDocumentsByWorkflowStatus(
    userId: string,
    statusFilter?: DocumentStatus,
    limit = 20,
    offset = 0
  ) {
    try {
      const { data, error } = await supabase.rpc('get_documents_by_workflow_status', {
        user_id_param: userId,
        status_filter: statusFilter,
        limit_count: limit,
        offset_count: offset
      })

      if (error) {
        console.error('Error fetching documents by workflow status:', error)
        toast.error('Failed to load documents')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getDocumentsByWorkflowStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Create a document review
  static async createReview(review: {
    document_id: string
    reviewer_id: string
    review_type: ReviewType
    comments?: string
    recommendations?: string
    score?: number
  }) {
    try {
      const { data, error } = await supabase
        .from('document_reviews')
        .insert({
          ...review,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating review:', error)
        toast.error('Failed to create review')
        return { data: null, error }
      }

      toast.success('Review created successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in createReview:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Update a review
  static async updateReview(
    reviewId: string,
    updates: {
      status?: ReviewStatus
      comments?: string
      recommendations?: string
      score?: number
      is_approved?: boolean
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('document_reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          completed_at: updates.status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', reviewId)
        .select()
        .single()

      if (error) {
        console.error('Error updating review:', error)
        toast.error('Failed to update review')
        return { data: null, error }
      }

      toast.success('Review updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in updateReview:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Create a revision request
  static async createRevisionRequest(request: {
    document_id: string
    requested_by: string
    requested_from: string
    reason: string
    specific_requirements?: string
    deadline?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('document_revision_requests')
        .insert({
          ...request,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating revision request:', error)
        toast.error('Failed to create revision request')
        return { data: null, error }
      }

      toast.success('Revision request created successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in createRevisionRequest:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Update revision request status
  static async updateRevisionRequestStatus(
    requestId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  ) {
    try {
      const { data, error } = await supabase
        .from('document_revision_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) {
        console.error('Error updating revision request:', error)
        toast.error('Failed to update revision request')
        return { data: null, error }
      }

      toast.success('Revision request updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in updateRevisionRequestStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Create a curation note
  static async createCurationNote(note: {
    document_id: string
    curator_id: string
    note_type: 'metadata' | 'content' | 'formatting' | 'accessibility' | 'final_check'
    note: string
  }) {
    try {
      const { data, error } = await supabase
        .from('document_curation_notes')
        .insert(note)
        .select()
        .single()

      if (error) {
        console.error('Error creating curation note:', error)
        toast.error('Failed to create curation note')
        return { data: null, error }
      }

      toast.success('Curation note added successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in createCurationNote:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Update curation note
  static async updateCurationNote(
    noteId: string,
    updates: {
      note?: string
      is_resolved?: boolean
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('document_curation_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single()

      if (error) {
        console.error('Error updating curation note:', error)
        toast.error('Failed to update curation note')
        return { data: null, error }
      }

      toast.success('Curation note updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in updateCurationNote:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Get workflow statistics for dashboard
  static async getWorkflowStatistics(userId: string, userRole: string) {
    try {
      const queries = []

      // Get counts for different statuses
      if (userRole === 'student') {
        queries.push(
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'under_review'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'needs_revision'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published')
        )
      } else if (userRole === 'faculty') {
        queries.push(
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('adviser_id', userId).eq('status', 'pending'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('adviser_id', userId).eq('status', 'under_review'),
          supabase.from('document_reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', userId).eq('status', 'pending'),
          supabase.from('document_revision_requests').select('*', { count: 'exact', head: true }).eq('requested_from', userId).eq('status', 'pending')
        )
      } else if (userRole === 'librarian' || userRole === 'admin') {
        queries.push(
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'curation'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'ready_for_publication')
        )
      }

      const results = await Promise.all(queries)
      const counts = results.map(result => result.count || 0)

      return {
        pending: counts[0] || 0,
        under_review: counts[1] || 0,
        needs_revision: counts[2] || 0,
        curation: counts[3] || 0,
        ready_for_publication: counts[4] || 0,
        published: counts[5] || 0
      }
    } catch (error) {
      console.error('Error in getWorkflowStatistics:', error)
      return {
        pending: 0,
        under_review: 0,
        needs_revision: 0,
        curation: 0,
        ready_for_publication: 0,
        published: 0
      }
    }
  }
}
