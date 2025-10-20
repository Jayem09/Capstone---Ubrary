import { useState, useEffect } from 'react'
import { Bell, X, Eye, CheckCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface WorkflowNotification {
  id: string
  type: 'status_change' | 'review_requested' | 'revision_requested' | 'approval' | 'rejection' | 'curation_note'
  title: string
  message: string
  document_id: string
  document_title: string
  is_read: boolean
  created_at: string
}

export function WorkflowNotifications() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get all documents where user is owner or adviser
      const { data: userDocs, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .or(`user_id.eq.${user.id},adviser_id.eq.${user.id}`)

      if (docsError) {
        console.error('Error fetching user documents:', docsError)
        return
      }

      // If no documents, return empty notifications
      if (!userDocs || userDocs.length === 0) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      // Get workflow history for those documents
      const documentIds = userDocs.map(doc => doc.id)
      const { data: historyData, error } = await supabase
        .from('workflow_history')
        .select(`
          id,
          to_status,
          reason,
          comments,
          created_at,
          document_id,
          documents!inner(id, title)
        `)
        .in('document_id', documentIds)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      // Transform workflow history into notifications
      const notifs: WorkflowNotification[] = (historyData || []).map(item => ({
        id: item.id,
        type: 'status_change' as const,
        title: `Document Status Changed`,
        message: item.reason || `Status updated to ${item.to_status}`,
        document_id: item.document_id,
        document_title: (item.documents as any)?.title || 'Unknown Document',
        is_read: false,
        created_at: item.created_at
      }))

      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscription for workflow changes
    if (user) {
      const subscription = supabase
        .channel('workflow_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workflow_history'
          },
          (payload) => {
            console.log('New workflow event:', payload)
            fetchNotifications()
            toast.info('New workflow update received')
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    // In a real implementation, this would update a notifications table
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  const getNotificationIcon = (type: WorkflowNotification['type']) => {
    switch (type) {
      case 'status_change':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'review_requested':
        return <Eye className="w-5 h-5 text-purple-500" />
      case 'revision_requested':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejection':
        return <X className="w-5 h-5 text-red-500" />
      case 'curation_note':
        return <MessageSquare className="w-5 h-5 text-indigo-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <Card className="absolute right-0 top-full mt-2 w-96 max-h-[600px] shadow-lg z-50 border-2">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Clock className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">No notifications yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      You'll be notified about workflow updates here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id)
                          // Navigate to document or workflow page
                          toast.info(`Opening document: ${notification.document_title}`)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500 truncate">
                                {notification.document_title}
                              </p>
                              <p className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t p-3 bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setIsOpen(false)
                      // Navigate to full notifications page
                      toast.info('Full notifications view coming soon')
                    }}
                  >
                    View All Notifications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

