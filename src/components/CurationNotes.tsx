import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { 
  FileText, 
  CheckCircle2, 
  Clock,
  User,
  Calendar,
  Plus,
  Tag,
  AlertCircle,
  Settings,
  Eye,
  Palette,
  BookOpen
} from 'lucide-react'
import { WorkflowService, type CurationNote } from '../services/workflowService'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface CurationNotesProps {
  documentId: string
  onNotesUpdate?: () => void
}

interface CurationNoteFormData {
  note_type: 'metadata' | 'content' | 'formatting' | 'accessibility' | 'final_check'
  note: string
}

const noteTypeConfig = {
  metadata: {
    label: 'Metadata Enhancement',
    icon: Tag,
    color: 'bg-blue-100 text-blue-800',
    description: 'Dublin Core and catalog metadata improvements'
  },
  content: {
    label: 'Content Review',
    icon: FileText,
    color: 'bg-purple-100 text-purple-800',
    description: 'Content quality and accuracy checks'
  },
  formatting: {
    label: 'Formatting',
    icon: Palette,
    color: 'bg-orange-100 text-orange-800',
    description: 'Document formatting and structure'
  },
  accessibility: {
    label: 'Accessibility',
    icon: Eye,
    color: 'bg-green-100 text-green-800',
    description: 'Accessibility and compliance checks'
  },
  final_check: {
    label: 'Final Check',
    icon: CheckCircle2,
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Final quality assurance review'
  }
}

export function CurationNotes({ documentId, onNotesUpdate }: CurationNotesProps) {
  const { user, hasPermission } = useAuth()
  const [notes, setNotes] = useState<CurationNote[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showResolved, setShowResolved] = useState(false)
  const [noteForm, setNoteForm] = useState<CurationNoteFormData>({
    note_type: 'metadata',
    note: ''
  })

  const canManageNotes = hasPermission('canManageWorkflow')

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_curation_notes')
        .select(`
          *,
          curator:users!curator_id(first_name, last_name, email)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching curation notes:', error)
        return
      }

      setNotes(data || [])
    } catch (error) {
      console.error('Error in fetchNotes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [documentId])

  const handleSubmitNote = async () => {
    if (!user || !noteForm.note.trim()) {
      toast.error('Please enter a note')
      return
    }

    setSubmitting(true)
    try {
      const result = await WorkflowService.createCurationNote({
        document_id: documentId,
        curator_id: user.id,
        note_type: noteForm.note_type,
        note: noteForm.note
      })

      if (result.error) {
        return
      }

      // Reset form and close dialog
      setNoteForm({
        note_type: 'metadata',
        note: ''
      })
      setShowNoteForm(false)
      
      // Refresh notes
      fetchNotes()
      onNotesUpdate?.()
      toast.success('Curation note added successfully')
    } catch (error) {
      console.error('Error submitting curation note:', error)
      toast.error('Failed to add curation note')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleResolved = async (noteId: string, currentStatus: boolean) => {
    try {
      const result = await WorkflowService.updateCurationNote(noteId, {
        is_resolved: !currentStatus
      })
      
      if (result.error) {
        return
      }

      fetchNotes()
      onNotesUpdate?.()
      toast.success(`Note marked as ${!currentStatus ? 'resolved' : 'unresolved'}`)
    } catch (error) {
      console.error('Error updating curation note:', error)
      toast.error('Failed to update note status')
    }
  }

  const filteredNotes = notes.filter(note => {
    if (selectedFilter !== 'all' && note.note_type !== selectedFilter) {
      return false
    }
    if (!showResolved && note.is_resolved) {
      return false
    }
    return true
  })

  const noteStats = {
    total: notes.length,
    unresolved: notes.filter(n => !n.is_resolved).length,
    resolved: notes.filter(n => n.is_resolved).length,
    byType: Object.keys(noteTypeConfig).reduce((acc, type) => {
      acc[type] = notes.filter(n => n.note_type === type && !n.is_resolved).length
      return acc
    }, {} as Record<string, number>)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading curation notes...</span>
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
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{noteStats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unresolved</p>
                <p className="text-2xl font-bold text-orange-600">{noteStats.unresolved}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{noteStats.resolved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span>Curation Notes</span>
              <Badge variant="outline" className="ml-2">
                Library Staff Only
              </Badge>
            </div>
            {canManageNotes && (
              <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Curation Note</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note_type">Note Type</Label>
                      <Select
                        value={noteForm.note_type}
                        onValueChange={(value: typeof noteForm.note_type) => 
                          setNoteForm(prev => ({ ...prev, note_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(noteTypeConfig).map(([key, config]) => {
                            const Icon = config.icon
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center">
                                  <Icon className="w-4 h-4 mr-2" />
                                  <div>
                                    <div className="font-medium">{config.label}</div>
                                    <div className="text-xs text-gray-500">{config.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="note">Note *</Label>
                      <Textarea
                        id="note"
                        placeholder="Add detailed curation notes..."
                        value={noteForm.note}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                        rows={6}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide specific guidance or requirements for this aspect of the document.
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowNoteForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitNote}
                        disabled={submitting || !noteForm.note.trim()}
                      >
                        {submitting ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="filter-type" className="text-sm mb-2">Filter by Type</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger id="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types ({notes.length})</SelectItem>
                    {Object.entries(noteTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label} ({noteStats.byType[key] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="show-resolved"
                  checked={showResolved}
                  onCheckedChange={(checked) => setShowResolved(!!checked)}
                />
                <Label htmlFor="show-resolved" className="text-sm cursor-pointer">
                  Show Resolved ({noteStats.resolved})
                </Label>
              </div>
            </div>
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFilter === 'all' && !showResolved
                  ? 'No curation notes yet'
                  : 'No notes match your filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {canManageNotes
                  ? 'Add curation notes to track quality control and improvements'
                  : 'Curation notes will appear here as library staff reviews this document'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => {
                const config = noteTypeConfig[note.note_type as keyof typeof noteTypeConfig]
                const Icon = config.icon

                return (
                  <Card 
                    key={note.id} 
                    className={`border-l-4 transition-all ${
                      note.is_resolved 
                        ? 'border-l-green-500 bg-green-50/30' 
                        : 'border-l-orange-500'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          {note.is_resolved ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </div>
                        
                        {canManageNotes && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleResolved(note.id, note.is_resolved)}
                            className={note.is_resolved ? 'border-orange-500 text-orange-600' : 'border-green-500 text-green-600'}
                          >
                            {note.is_resolved ? (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Reopen
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolve
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Curator ID: {note.curator_id}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className={note.is_resolved ? 'opacity-75' : ''}>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

