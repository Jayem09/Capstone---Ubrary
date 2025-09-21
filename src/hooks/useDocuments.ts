import { useState, useEffect, useCallback, useMemo } from 'react'
import { DocumentService } from '../services/documentService'
import type { Document } from '../types/database'

interface UseDocumentsOptions {
  limit?: number
  offset?: number
  category?: string
  search?: string
  userId?: string
  autoFetch?: boolean
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const { autoFetch = true, ...fetchOptions } = useMemo(() => options, [options])

  const fetchDocuments = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)

    try {
      const result = await DocumentService.getDocuments({
        ...fetchOptions,
        offset: reset ? 0 : fetchOptions.offset
      })

      if (result.error) {
        setError('Failed to load documents')
        return
      }

      if (reset) {
        setDocuments(result.data)
      } else {
        setDocuments(prev => [...prev, ...result.data])
      }

      // Check if there are more documents to load
      setHasMore(result.data.length === (fetchOptions.limit || 20))
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchOptions])

  const refreshDocuments = useCallback(() => {
    fetchDocuments(true)
  }, [fetchDocuments])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchDocuments(false)
    }
  }, [loading, hasMore, fetchDocuments])

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments(true)
    }
  }, [
    options.category, 
    options.search, 
    options.userId,
    autoFetch
  ])

  return {
    documents,
    loading,
    error,
    hasMore,
    fetchDocuments,
    refreshDocuments,
    loadMore
  }
}

// Hook for getting a single document
export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) {
      setDocument(null)
      return
    }

    const fetchDocument = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await DocumentService.getDocument(documentId)

        if (result.error) {
          setError('Failed to load document')
          return
        }

        setDocument(result.data)
      } catch (err) {
        setError('An unexpected error occurred')
        console.error('Error fetching document:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  return {
    document,
    loading,
    error,
    refetch: () => {
      if (documentId) {
        // Re-trigger the effect
        setDocument(null)
      }
    }
  }
}

// Hook for document upload
export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadDocument = async (documentData: {
    title: string
    abstract: string
    program: string
    year: number
    userId: string
    adviserId?: string
    keywords: string[]
    authors: string[]
    file?: File
  }) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress for UI feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await DocumentService.createDocument(documentData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.error) {
        setError('Failed to upload document')
        return { data: null, error: result.error }
      }

      // Complete the progress
      setTimeout(() => {
        setUploadProgress(0)
        setUploading(false)
      }, 1000)

      return { data: result.data, error: null }
    } catch (err) {
      setError('An unexpected error occurred')
      setUploading(false)
      setUploadProgress(0)
      console.error('Error uploading document:', err)
      return { data: null, error: err }
    }
  }

  const resetUpload = () => {
    setUploading(false)
    setUploadProgress(0)
    setError(null)
  }

  return {
    uploading,
    uploadProgress,
    error,
    uploadDocument,
    resetUpload
  }
}
