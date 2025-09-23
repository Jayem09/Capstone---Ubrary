import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Edit, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Send,
  MessageSquare
} from 'lucide-react'
import { WorkflowService, type RevisionRequest } from '../services/workflowService'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface RevisionRequestProps {
  documentId: string
  onRevisionUpdate?: () => void
}

interface RevisionFormData {
  requested_from: string
  reason: string
  specific_requirements: string
  deadline: string
}

export function RevisionRequest({ documentId, onRevisionUpdate }: RevisionRequestProps) {
  const { user } = useAuth()
  const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [revisionForm, setRevisionForm] = useState<RevisionFormData>({
    requested_from: '',
    reason: '',
    specific_requirements: '',
    deadline: ''
  })

  const fetchRevisionRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_revision_requests')
        .select(`
          *,
          requested_by_user:users!requested_by(first_name, last_name, email),
          requested_from_user:users!requested_from(first_name, last_name, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching revision requests:', error)
        return
      }

      setRevisionRequests(data || [])
    } catch (error) {
      console.error('Error in fetchRevisionRequests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevisionRequests()
  }, [documentId])

  const handleSubmitRevisionRequest = async () => {
    if (!user || !revisionForm.requested_from || !revisionForm.reason.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const result = await WorkflowService.createRevisionRequest({
        document_id: documentId,
        requested_by: user.id,
        requested_from: revisionForm.requested_from,
        reason: revisionForm.reason,
        specific_requirements: revisionForm.specific_requirements,
        deadline: revisionForm.deadline || undefined
      })

      if (result.error) {
        return
      }

      // Reset form and close dialog
      setRevisionForm({
        requested_from: '',
        reason: '',
        specific_requirements: '',
        deadline: ''
      })
      setShowRequestForm(false)
      
      // Refresh revision requests
      fetchRevisionRequests()
      onRevisionUpdate?.()
    } catch (error) {
      console.error('Error submitting revision request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRevisionStatus = async (requestId: string, status: 'pending' | 'in_progress' | 'completed' | 'overdue') => {
    try {
      const result = await WorkflowService.updateRevisionRequestStatus(requestId, status)
      
      if (result.error) {
        return
      }

      fetchRevisionRequests()
      onRevisionUpdate?.()
    } catch (error) {
      console.error('Error updating revision status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'in_progress': return Edit
      case 'completed': return CheckCircle
      case 'overdue': return AlertCircle
      default: return Clock
    }
  }

  const isOverdue = (deadline: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading revision requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Revision Requests</span>
          <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Request Revision
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Document Revision</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requested_from">Request From (User ID)</Label>
                  <Input
                    id="requested_from"
                    placeholder="Enter user ID to request revision from"
                    value={revisionForm.requested_from}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, requested_from: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Revision *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why this revision is needed..."
                    value={revisionForm.reason}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="specific_requirements">Specific Requirements</Label>
                  <Textarea
                    id="specific_requirements"
                    placeholder="Detail specific changes or improvements needed..."
                    value={revisionForm.specific_requirements}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, specific_requirements: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={revisionForm.deadline}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRevisionRequest}
                    disabled={submitting || !revisionForm.reason.trim() || !revisionForm.requested_from.trim()}
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {revisionRequests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No revision requests</h3>
            <p className="text-gray-500">No revision requests have been made for this document</p>
          </div>
        ) : (
          <div className="space-y-4">
            {revisionRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status)
              const overdue = isOverdue(request.deadline || '')
              
              return (
                <Card key={request.id} className={`border-l-4 ${
                  request.status === 'completed' ? 'border-l-green-500' :
                  request.status === 'overdue' || overdue ? 'border-l-red-500' :
                  'border-l-orange-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status}
                        </Badge>
                        {overdue && request.status !== 'completed' && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {request.status === 'pending' && user?.id === request.requested_from && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRevisionStatus(request.id, 'in_progress')}
                          >
                            Start Work
                          </Button>
                        </div>
                      )}
                      
                      {request.status === 'in_progress' && user?.id === request.requested_from && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateRevisionStatus(request.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Requested by: {request.requested_by}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Requested from: {request.requested_from}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.deadline && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Due: {new Date(request.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1">Reason</h4>
                      <p className="text-gray-700 text-sm">{request.reason}</p>
                    </div>

                    {request.specific_requirements && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Specific Requirements</h4>
                        <p className="text-gray-700 text-sm">{request.specific_requirements}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
