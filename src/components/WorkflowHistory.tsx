import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Clock, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
  FileText,
  Download,
  Filter,
  GitCommit,
  History,
  AlertCircle
} from 'lucide-react'
import { type DocumentStatus } from '../services/workflowService'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface WorkflowHistoryProps {
  documentId: string
}

interface WorkflowHistoryEntry {
  id: string
  document_id: string
  from_status: DocumentStatus | null
  to_status: DocumentStatus
  changed_by: string
  reason: string | null
  comments: string | null
  created_at: string
  changer?: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

const statusConfig = {
  pending: { 
    label: 'Pending Review', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock 
  },
  under_review: { 
    label: 'Under Review', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Eye 
  },
  needs_revision: { 
    label: 'Needs Revision', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Edit 
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  curation: { 
    label: 'In Curation', 
    color: 'bg-purple-100 text-purple-800', 
    icon: MessageSquare 
  },
  ready_for_publication: { 
    label: 'Ready to Publish', 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: CheckCircle 
  },
  published: { 
    label: 'Published', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle 
  }
}

export function WorkflowHistory({ documentId }: WorkflowHistoryProps) {
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | DocumentStatus>('all')
  const [showFilters, setShowFilters] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workflow_history')
        .select(`
          *,
          changer:users!changed_by(first_name, last_name, email, role)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workflow history:', error)
        toast.error('Failed to load workflow history')
        return
      }

      setHistory(data || [])
    } catch (error) {
      console.error('Error in fetchHistory:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [documentId])

  const exportHistory = () => {
    // Create CSV export
    const headers = ['Date', 'From Status', 'To Status', 'Changed By', 'Reason', 'Comments']
    const rows = history.map(entry => [
      new Date(entry.created_at).toLocaleString(),
      entry.from_status || 'Initial',
      entry.to_status,
      entry.changer ? `${entry.changer.first_name} ${entry.changer.last_name}` : 'Unknown',
      entry.reason || '',
      entry.comments || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-history-${documentId}.csv`
    link.click()
    toast.success('History exported successfully')
  }

  const filteredHistory = filterStatus === 'all' 
    ? history 
    : history.filter(entry => entry.to_status === filterStatus)

  const statistics = {
    total: history.length,
    averageTimeInStage: '2.5 days', // This would be calculated from actual data
    totalDuration: history.length > 0 
      ? Math.ceil((new Date().getTime() - new Date(history[history.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    statusChanges: Object.keys(statusConfig).reduce((acc, status) => {
      acc[status] = history.filter(h => h.to_status === status).length
      return acc
    }, {} as Record<string, number>)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading workflow history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status Changes</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <GitCommit className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalDuration}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Time/Stage</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageTimeInStage}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5" />
              <span>Workflow History</span>
              <Badge variant="outline">{filteredHistory.length} entries</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({history.length})
                </Button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={filterStatus === status ? 'default' : 'outline'}
                    onClick={() => setFilterStatus(status as DocumentStatus)}
                    className={filterStatus === status ? config.color : ''}
                  >
                    {config.label} ({statistics.statusChanges[status] || 0})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No workflow history yet
              </h3>
              <p className="text-gray-500">
                Workflow changes will be tracked and displayed here
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline Entries */}
              <div className="space-y-6">
                {filteredHistory.map((entry, index) => {
                  const toConfig = statusConfig[entry.to_status]
                  const fromConfig = entry.from_status ? statusConfig[entry.from_status] : null
                  const ToIcon = toConfig.icon
                  const isFirst = index === 0
                  
                  return (
                    <div key={entry.id} className="relative flex items-start gap-4">
                      {/* Timeline Dot */}
                      <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white ${
                        isFirst ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <ToIcon className={`w-8 h-8 ${isFirst ? 'text-white' : 'text-gray-600'}`} />
                      </div>

                      {/* Content Card */}
                      <Card className={`flex-1 ${isFirst ? 'border-blue-500 border-2' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {fromConfig && (
                                <>
                                  <Badge className={fromConfig.color}>
                                    {fromConfig.label}
                                  </Badge>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                </>
                              )}
                              <Badge className={toConfig.color}>
                                <ToIcon className="w-3 h-3 mr-1" />
                                {toConfig.label}
                              </Badge>
                              {isFirst && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {entry.changer 
                                ? `${entry.changer.first_name} ${entry.changer.last_name} (${entry.changer.role})`
                                : 'Unknown User'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(entry.created_at).toLocaleString()}
                            </div>
                          </div>

                          {/* Reason and Comments */}
                          {entry.reason && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {entry.reason}
                              </p>
                            </div>
                          )}

                          {entry.comments && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Comments:</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                                {entry.comments}
                              </p>
                            </div>
                          )}

                          {!entry.reason && !entry.comments && (
                            <div className="flex items-center text-sm text-gray-400 italic">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              No additional details provided
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

