import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  User,
  RefreshCw,
  Settings,
  Filter,
  Download,
  Search
} from 'lucide-react'
import { WorkflowService, type DocumentStatus } from '../services/workflowService'
import { useAuth } from '../contexts/AuthContext'
import { useSidebarStatsContext } from '../contexts/SidebarStatsContext'
import { toast } from 'sonner'
import { WorkflowActionsDropdown } from './WorkflowActionsDropdown'

interface WorkflowDocument {
  id: string
  title: string
  abstract: string
  program: string
  year: number
  status: DocumentStatus
  author_names: string
  adviser_name: string
  created_at: string
  updated_at: string
  workflow_position: number
}

interface WorkflowDashboardProps {
  onDocumentView?: (document: any) => void
}

const statusConfig = {
  pending: { 
    label: 'Pending Review', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock,
    description: 'Document submitted and awaiting initial review'
  },
  under_review: { 
    label: 'Under Review', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Eye,
    description: 'Document is being reviewed by faculty'
  },
  needs_revision: { 
    label: 'Needs Revision', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Edit,
    description: 'Document requires revisions before approval'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Document approved and ready for curation'
  },
  curation: { 
    label: 'In Curation', 
    color: 'bg-purple-100 text-purple-800', 
    icon: MessageSquare,
    description: 'Document being prepared for publication'
  },
  ready_for_publication: { 
    label: 'Ready to Publish', 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: CheckCircle,
    description: 'Document ready for final publication'
  },
  published: { 
    label: 'Published', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
    description: 'Document published and available to public'
  }
}

export function WorkflowDashboard({ onDocumentView }: WorkflowDashboardProps) {
  const { user, hasPermission } = useAuth()
  const { triggerRefresh } = useSidebarStatsContext()
  const [documents, setDocuments] = useState<WorkflowDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all')
  const [statistics, setStatistics] = useState({
    pending: 0,
    under_review: 0,
    needs_revision: 0,
    curation: 0,
    ready_for_publication: 0,
    published: 0
  })

  // Advanced filtering for librarians
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Document viewer is now handled by the App component

  const fetchDocuments = async (statusFilter?: DocumentStatus) => {
    if (!user) return

    setLoading(true)
    try {
      console.log('🔍 Fetching documents for user:', user.id, 'with status:', statusFilter)
      
      const result = await WorkflowService.getDocumentsByWorkflowStatus(
        user.id,
        statusFilter,
        50,
        0
      )

      console.log('📊 Workflow function result:', result)

      if (result.error) {
        console.error('❌ Workflow function error:', result.error)
        toast.error('Failed to load documents')
        return
      }

      console.log('📄 Documents received:', result.data?.length || 0, 'documents')
      console.log('📋 Documents data:', result.data)
      
      setDocuments(result.data)
    } catch (error) {
      console.error('💥 Error fetching documents:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    if (!user) return

    try {
      const stats = await WorkflowService.getWorkflowStatistics(user.id, user.role)
      setStatistics(stats)

    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchStatistics()
  }, [user])

  useEffect(() => {
    fetchDocuments(selectedStatus === 'all' ? undefined : selectedStatus as DocumentStatus)
  }, [selectedStatus])

  // Convert WorkflowDocument to DocumentViewer format
  const convertToViewerDocument = (workflowDoc: WorkflowDocument) => {
    return {
      id: workflowDoc.id,
      title: workflowDoc.title,
      authors: workflowDoc.author_names ? workflowDoc.author_names.split(', ') : ['Unknown Author'],
      year: workflowDoc.year,
      program: workflowDoc.program,
      adviser: 'Unknown Adviser', // We don't have this in WorkflowDocument
      abstract: workflowDoc.abstract,
      keywords: [], // We don't have this in WorkflowDocument
      downloadCount: 0,
      dateAdded: workflowDoc.created_at,
      fileSize: 'Unknown',
      pages: 0,
      thumbnail: ''
    }
  }

  const handleStartReview = async (document: WorkflowDocument) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    console.log('🔄 Starting review for document:', document.id)

    try {
      // First, update the status
      const result = await WorkflowService.updateDocumentStatus(
        document.id,
        'under_review',
        user.id,
        'Review started'
      )

      console.log('📊 Status change result:', result)

      if (result.error) {
        console.error('❌ Status change failed:', result.error)
        toast.error('Failed to update document status: ' + ((result.error as any)?.message || 'Unknown error'))
        return
      }

      console.log('✅ Status change successful')
      
      // Refresh the documents list
      await fetchDocuments(selectedStatus === 'all' ? undefined : selectedStatus as DocumentStatus)
      await fetchStatistics()
      
      // Open the document for review
      const viewerDocument = convertToViewerDocument(document)
      // Trigger sidebar stats refresh
      triggerRefresh()
      
      // Open document viewer if callback is provided
      if (onDocumentView) {
        onDocumentView(viewerDocument)
      }
      
      console.log('📋 Documents refreshed, sidebar stats triggered, and viewer opened')
    } catch (error) {
      console.error('💥 Unexpected error starting review:', error)
      toast.error('An unexpected error occurred while starting review')
    }
  }

  const handleStatusChange = async (documentId: string, newStatus: DocumentStatus, reason?: string) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    console.log('🔄 Starting status change:', { documentId, newStatus, userId: user.id, reason })

    try {
      const result = await WorkflowService.updateDocumentStatus(
        documentId,
        newStatus,
        user.id,
        reason
      )

      console.log('📊 Status change result:', result)

      if (result.error) {
        console.error('❌ Status change failed:', result.error)
        toast.error('Failed to update document status: ' + ((result.error as any)?.message || 'Unknown error'))
        return
      }

      console.log('✅ Status change successful')
      
      // Refresh the documents list
      await fetchDocuments(selectedStatus === 'all' ? undefined : selectedStatus as DocumentStatus)
      await fetchStatistics()
      
      // Trigger sidebar stats refresh
      triggerRefresh()
      
      console.log('📋 Documents refreshed and sidebar stats triggered')
    } catch (error) {
      console.error('💥 Unexpected error updating status:', error)
      toast.error('An unexpected error occurred while updating status')
    }
  }

  const filteredDocuments = selectedStatus === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === selectedStatus)

  const getStatusActions = (document: WorkflowDocument) => {
    const actions = []

    switch (document.status) {
      case 'pending':
        if (user?.role === 'faculty' || user?.role === 'librarian' || user?.role === 'admin') {
          actions.push(
            <Button
              key="start-review"
              size="sm"
              variant="outline"
              onClick={() => handleStartReview(document)}
            >
              Start Review
            </Button>
          )
        }
        break

      case 'under_review':
        if (user?.role === 'faculty' || user?.role === 'librarian' || user?.role === 'admin') {
          actions.push(
            <Button
              key="approve-publish"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusChange(document.id, 'published', 'Document approved and published')}
            >
              Approve & Publish
            </Button>,
            <Button
              key="approve-curation"
              size="sm"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => handleStatusChange(document.id, 'approved', 'Document approved for curation')}
            >
              Approve for Curation
            </Button>,
            <Button
              key="needs-revision"
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(document.id, 'needs_revision', 'Document needs revision')}
            >
              Needs Revision
            </Button>
          )
        }
        break

      case 'needs_revision':
        if (user?.id === document.author_names || user?.role === 'admin') {
          actions.push(
            <Button
              key="resubmit"
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(document.id, 'pending', 'Document resubmitted')}
            >
              Resubmit
            </Button>
          )
        }
        break

      case 'approved':
        if (user?.role === 'librarian' || user?.role === 'admin') {
          actions.push(
            <Button
              key="start-curation"
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(document.id, 'curation', 'Curation started')}
            >
              Start Curation
            </Button>
          )
        }
        break

      case 'curation':
        if (user?.role === 'librarian' || user?.role === 'admin') {
          actions.push(
            <Button
              key="ready-publish"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => handleStatusChange(document.id, 'ready_for_publication', 'Ready for publication')}
            >
              Ready to Publish
            </Button>
          )
        }
        break

      case 'ready_for_publication':
        if (user?.role === 'librarian' || user?.role === 'admin') {
          actions.push(
            <Button
              key="publish"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusChange(document.id, 'published', 'Document published')}
            >
              Publish
            </Button>
          )
        }
        break
    }

    return actions
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading workflow dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statistics).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig]
          if (!config) return null // Skip unknown statuses
          const Icon = config.icon

          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {config.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workflow Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Workflow</span>
            <div className="flex items-center gap-2">
              {/* Advanced Controls for Librarians */}
              {hasPermission('canManageWorkflow') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Export functionality
                      toast.info('Export feature coming soon')
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchDocuments(selectedStatus === 'all' ? undefined : selectedStatus as DocumentStatus)
                  fetchStatistics()
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters Panel for Librarians */}
          {showAdvancedFilters && hasPermission('canManageWorkflow') && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Workflow Management
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search Documents
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by title, author..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Program Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Program
                  </label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Nursing">Nursing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Submission Date
                  </label>
                  <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions for Librarians */}
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Bulk Actions</h5>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Bulk Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Bulk Edit Metadata
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as DocumentStatus | 'all')}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Review</TabsTrigger>
              <TabsTrigger value="needs_revision">Revision</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="curation">Curation</TabsTrigger>
              <TabsTrigger value="ready_for_publication">Ready</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-6">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500">
                    {selectedStatus === 'all'
                      ? 'No documents in the workflow yet.'
                      : `No documents with status "${statusConfig[selectedStatus as keyof typeof statusConfig]?.label}"`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => {
                    const config = statusConfig[document.status as keyof typeof statusConfig]
                    if (!config) return null
                    const Icon = config.icon
                    const actions = getStatusActions(document)

                    return (
                      <Card key={document.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge className={config.color}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Position: {document.workflow_position}
                                </span>
                              </div>
                              
                              <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">
                                {document.title}
                              </h3>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {document.abstract}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {document.author_names}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {document.program}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(document.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {actions.length > 0 && actions}
                              <WorkflowActionsDropdown
                                document={document}
                                onView={() => {
                                  const viewerDocument = convertToViewerDocument(document)
                                  if (onDocumentView) {
                                    onDocumentView(viewerDocument)
                                  }
                                }}
                                onStartReview={() => handleStartReview(document)}
                                onApprove={() => handleStatusChange(document.id, 'published', 'Document approved and published')}
                                onReject={() => handleStatusChange(document.id, 'rejected', 'Document rejected')}
                                onRequestRevision={() => handleStatusChange(document.id, 'needs_revision', 'Document needs revision')}
                                userRole={user?.role as any}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Viewer is now handled by the App component for fullscreen mode */}
    </div>
  )
}
