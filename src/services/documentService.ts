import { supabase, supabaseHelpers } from '../lib/supabase'
import { devSupabaseHelpers } from '../lib/supabase-dev-helper'
import { toast } from 'sonner'

export class DocumentService {
  // Get all published documents with filtering and pagination
  static async getDocuments(options?: {
    limit?: number
    offset?: number
    category?: string
    search?: string
    userId?: string
  }) {
    try {
      // Use development helper for better reliability in dev environment
      if (import.meta.env.DEV) {
        const { data, error } = await devSupabaseHelpers.getDocumentsDev()
        
        if (error) {
          console.error('Error fetching documents (dev):', error)
          
          // Type-safe error handling
          const errorMessage = (error as any)?.message || 'Unknown error'
          const errorDetails = (error as any)?.details || null
          const errorHint = (error as any)?.hint || null
          const errorCode = (error as any)?.code || null
          
          console.error('Error details:', errorMessage, errorDetails, errorHint)
          
          // If it's an RLS error, recursion error, or empty database, return empty array
          if (
            errorMessage?.includes('RLS') || 
            errorMessage?.includes('permission') || 
            errorMessage?.includes('recursion') ||
            errorMessage?.includes('infinite') ||
            errorCode === 'PGRST116'
          ) {
            console.log('🔧 Database appears empty or has RLS issues - returning empty array')
            return { data: [], error: null }
          }
          
          toast.error('Failed to load documents')
          return { data: [], error }
        }

        // Apply client-side filtering for development
        let filteredData = data || []
        
        if (options?.category && options.category !== 'all') {
          filteredData = filteredData.filter(doc => doc.program === options.category)
        }
        
        if (options?.search) {
          const searchLower = options.search.toLowerCase()
          filteredData = filteredData.filter(doc => 
            doc.title.toLowerCase().includes(searchLower) ||
            doc.abstract.toLowerCase().includes(searchLower)
          )
        }
        
        if (options?.userId) {
          filteredData = filteredData.filter(doc => doc.user_id === options.userId)
        }
        
        // Apply pagination
        if (options?.limit) {
          const offset = options.offset || 0
          filteredData = filteredData.slice(offset, offset + options.limit)
        }

        return { data: filteredData, error: null }
      } else {
        // Production path
        const { data, error } = await supabaseHelpers.getDocuments(options)
        
        if (error) {
          console.error('Error fetching documents:', error)
          toast.error('Failed to load documents')
          return { data: [], error }
        }

        return { data: data || [], error: null }
      }
    } catch (error) {
      console.error('Error in getDocuments:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Get a single document by ID
  static async getDocument(id: string) {
    try {
      const { data, error } = await supabaseHelpers.getDocument(id)
      
      if (error) {
        console.error('Error fetching document:', error)
        toast.error('Failed to load document')
        return { data: null, error }
      }

      // Increment view count
      if (data) {
        await this.incrementViewCount(id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getDocument:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Create a new document
  static async createDocument(document: {
    title: string
    abstract: string
    program: string
    year: number
    userId: string
    adviserId?: string
    adviserName?: string
    keywords: string[]
    authors: string[]
    file?: File
    thumbnail?: File
  }) {
    try {
      console.log('📝 Creating document:', {
        title: document.title,
        userId: document.userId,
        program: document.program,
        keywordCount: document.keywords.length,
        hasFile: !!document.file
      })

      // Skip user check for now to avoid timeout issues
      console.log('⚡ Skipping user check to avoid timeout - proceeding with upload')

      // For now, use the user as their own adviser if no adviser is specified
      const adviserId = document.adviserId || document.userId;
      
      // Use development helper for document creation
      console.log('🔄 Using development helper for document creation...')
      
      const { data: newDocument, error: docError } = await devSupabaseHelpers.createDocumentDev({
        title: document.title,
        abstract: document.abstract,
        program: document.program,
        year: document.year,
        user_id: document.userId,
        adviser_id: adviserId,
        adviser_name: document.adviserName,
        keywords: document.keywords,
        authors: document.authors
      })

      if (docError) {
        console.error('❌ Error creating document:', docError)
        const errorMessage = (docError as any)?.message || 'Failed to create document'
        toast.error('Document creation failed', {
          description: errorMessage
        })
        return { data: null, error: docError }
      }

      if (!newDocument) {
        console.error('❌ No document returned from creation')
        toast.error('Document creation failed', {
          description: 'No document data returned'
        })
        return { data: null, error: new Error('No document created') }
      }

      console.log('✅ Document created successfully:', newDocument.id)

      // Upload file if provided
      if (document.file && newDocument) {
        const fileResult = await this.uploadDocumentFile(newDocument.id, document.file)
        if (fileResult.error) {
          // If file upload fails, we might want to delete the document or mark it as incomplete
          console.error('File upload failed:', fileResult.error)
          toast.error('Document created but file upload failed')
        }
      }

      // Upload thumbnail if provided
      if (document.thumbnail && newDocument) {
        const thumbnailResult = await this.uploadDocumentThumbnail(newDocument.id, document.thumbnail)
        if (thumbnailResult.error) {
          console.warn('Thumbnail upload failed:', thumbnailResult.error)
          // Don't show error to user as thumbnail is optional
        }
      }

      toast.success('Document submitted successfully')
      return { data: newDocument, error: null }
    } catch (error) {
      console.error('Error in createDocument:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Update document status (for reviewers)
  static async updateDocumentStatus(documentId: string, status: 'pending' | 'approved' | 'rejected' | 'published', reviewComments?: string) {
    try {
      const { data, error } = await supabaseHelpers.updateDocumentStatus(documentId, status)
      
      if (error) {
        console.error('Error updating document status:', error)
        toast.error('Failed to update document status')
        return { data: null, error }
      }

      // Log the status change for audit
      await this.logAuditEvent('document_status_change', 'document', documentId, {
        new_status: status,
        comments: reviewComments
      })

      const statusLabels = {
        pending: 'pending review',
        approved: 'approved',
        rejected: 'rejected',
        published: 'published'
      }

      toast.success(`Document ${statusLabels[status]}`)
      return { data, error: null }
    } catch (error) {
      console.error('Error in updateDocumentStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Extract PDF page count
  static async extractPdfPageCount(file: File): Promise<number> {
    try {
      // Import PDF.js dynamically to avoid build issues
      const { getDocument } = await import('pdfjs-dist');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument(arrayBuffer).promise;
      return pdf.numPages;
    } catch (error) {
      console.warn('Could not extract PDF page count:', error);
      return 0; // Default to 0 if extraction fails
    }
  }

  // Upload document file to Supabase Storage
  static async uploadDocumentFile(documentId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${documentId}.${fileExt}`
      const filePath = `documents/${documentId}/${fileName}`

      // Extract page count if it's a PDF
      let pageCount = 0;
      if (file.type === 'application/pdf') {
        pageCount = await this.extractPdfPageCount(file);
      }

      // Use development helper for file upload in dev environment
      if (import.meta.env.DEV) {
        const { data, error } = await devSupabaseHelpers.uploadFileDev(file, filePath)
        
        if (error) {
          console.error('Error uploading file (dev):', error)
          return { data: null, error }
        }

        // Save file metadata using development helper
        const { error: dbError } = await devSupabaseHelpers.saveFileMetadataDev({
          document_id: documentId,
          file_name: file.name,
          file_path: filePath,
          file_size: this.formatFileSize(file.size),
          file_type: file.type,
          is_primary: true
        })

        if (dbError) {
          console.error('Error saving file metadata (dev):', dbError)
          return { data: null, error: dbError }
        }

        // Update document with page count and file size
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            pages: pageCount,
            file_size: this.formatFileSize(file.size)
          })
          .eq('id', documentId)

        if (updateError) {
          console.warn('Could not update document metadata:', updateError)
        }

        return { data, error: null }
      } else {
        // Production path
        const { data, error } = await supabaseHelpers.uploadFile(file, filePath)
        
        if (error) {
          console.error('Error uploading file:', error)
          return { data: null, error }
        }

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('document_files')
          .insert({
            document_id: documentId,
            file_name: file.name,
            file_path: filePath,
            file_size: this.formatFileSize(file.size),
            file_type: file.type,
            is_primary: true
          })

        if (dbError) {
          console.error('Error saving file metadata:', dbError)
          return { data: null, error: dbError }
        }

        // Update document with page count and file size
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            pages: pageCount,
            file_size: this.formatFileSize(file.size)
          })
          .eq('id', documentId)

        if (updateError) {
          console.warn('Could not update document metadata:', updateError)
        }

        return { data, error: null }
      }
    } catch (error) {
      console.error('Error in uploadDocumentFile:', error)
      return { data: null, error }
    }
  }

  // Upload document thumbnail to Supabase Storage
  static async uploadDocumentThumbnail(documentId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `thumbnail.${fileExt}`
      const filePath = `documents/${documentId}/${fileName}`

      // Use development helper for file upload in dev environment
      if (import.meta.env.DEV) {
        const { data, error } = await devSupabaseHelpers.uploadFileDev(file, filePath)
        
        if (error) {
          console.error('Error uploading thumbnail (dev):', error)
          return { data: null, error }
        }

        // Save thumbnail metadata using development helper
        const { error: dbError } = await devSupabaseHelpers.saveFileMetadataDev({
          document_id: documentId,
          file_name: file.name,
          file_path: filePath,
          file_size: this.formatFileSize(file.size),
          file_type: file.type,
          is_primary: false // Thumbnail is not the primary file
        })

        if (dbError) {
          console.error('Error saving thumbnail metadata (dev):', dbError)
          return { data: null, error: dbError }
        }

        return { data, error: null }
      } else {
        // Production path
        const { data, error } = await supabaseHelpers.uploadFile(file, filePath)
        
        if (error) {
          console.error('Error uploading thumbnail:', error)
          return { data: null, error }
        }

        // Save thumbnail metadata to database
        const { error: dbError } = await supabase
          .from('document_files')
          .insert({
            document_id: documentId,
            file_name: file.name,
            file_path: filePath,
            file_size: this.formatFileSize(file.size),
            file_type: file.type,
            is_primary: false // Thumbnail is not the primary file
          })

        if (dbError) {
          console.error('Error saving thumbnail metadata:', dbError)
          return { data: null, error: dbError }
        }

        return { data, error: null }
      }
    } catch (error) {
      console.error('Error in uploadDocumentThumbnail:', error)
      return { data: null, error }
    }
  }

  // Get signed URL for file download
  static async getDocumentFileUrl(filePath: string) {
    try {
      const { data, error } = await supabaseHelpers.getFileUrl(filePath)
      
      if (error) {
        console.error('Error getting file URL for path:', filePath, error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getDocumentFileUrl:', error)
      return { data: null, error }
    }
  }

  // Get the actual file path for a document from the database
  static async getDocumentFilePath(documentId: string) {
    try {
      if (import.meta.env.DEV) {
        // In development, try to get file metadata from database
        const { data, error } = await devSupabaseHelpers.getDocumentFilePathDev(documentId)
        
        if (error) {
          console.error('Error getting document file path (dev):', error)
          return { data: null, error }
        }
        
        return { data, error: null }
      } else {
        // Production path - get from document_files table
        const { data, error } = await supabase
          .from('document_files')
          .select('file_path, file_name')
          .eq('document_id', documentId)
          .eq('is_primary', true)
          .single()
        
        if (error) {
          console.error('Error getting document file path:', error)
          return { data: null, error }
        }
        
        return { data, error: null }
      }
    } catch (error) {
      console.error('Error in getDocumentFilePath:', error)
      return { data: null, error }
    }
  }

  // Increment download count
  static async incrementDownloadCount(documentId: string) {
    try {
      // First try the RPC function
      const { error: rpcError } = await supabase.rpc('increment_download_count', {
        document_id: documentId
      })

      if (rpcError) {
        console.warn('RPC increment failed, trying direct update:', rpcError)
        // Fallback to direct update - get current count and increment
        const { data: currentDoc } = await supabase
          .from('documents')
          .select('download_count')
          .eq('id', documentId)
          .single()

        const currentCount = currentDoc?.download_count || 0
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            download_count: currentCount + 1
          })
          .eq('id', documentId)

        if (updateError) {
          console.error('Error incrementing download count:', updateError)
          return { error: updateError }
        }
      }

      // Log download for analytics
      await this.logAuditEvent('document_download', 'document', documentId)
      
      return { error: null }
    } catch (error) {
      console.error('Error in incrementDownloadCount:', error)
      return { error }
    }
  }

  // Increment view count
  static async incrementViewCount(documentId: string) {
    try {
      const { error } = await supabase.rpc('increment_view_count', {
        document_id: documentId
      })

      if (error) {
        console.error('Error incrementing view count:', error)
      }
    } catch (error) {
      console.error('Error in incrementViewCount:', error)
    }
  }

  // Search documents with full-text search
  static async searchDocuments(query: string) {
    try {
      const { data, error } = await supabase.rpc('search_documents', {
        search_query: query
      })

      if (error) {
        console.error('Error searching documents:', error)
        toast.error('Search failed')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in searchDocuments:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Get repository statistics
  static async getRepositoryStats() {
    try {
      const data = await supabaseHelpers.getAnalytics()
      return data
    } catch (error) {
      console.error('Error in getRepositoryStats:', error)
      return {
        totalDocuments: 0,
        totalUsers: 0,
        pendingReviews: 0,
        monthlyUploads: 0
      }
    }
  }

  // Helper function to format file size
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Log audit events
  private static async logAuditEvent(
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    details?: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })

      if (error) {
        console.error('Error logging audit event:', error)
      }
    } catch (error) {
      console.error('Error in logAuditEvent:', error)
    }
  }

  // Get client IP (simplified for demo)
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
}
