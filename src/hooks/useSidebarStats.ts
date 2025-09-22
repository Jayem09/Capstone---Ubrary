import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StarredService } from '../services/starredService'

export interface SidebarStats {
  totalDocuments: number
  recentDocuments: number
  myUploads: number
  starredDocuments: number
  workflowDocuments: number
  categoryCounts: Record<string, number>
  repositoryStats: {
    totalTheses: number
    thisMonth: number
    totalDownloads: number
  }
}

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats>({
    totalDocuments: 0,
    recentDocuments: 0,
    myUploads: 0,
    starredDocuments: 0,
    workflowDocuments: 0,
    categoryCounts: {},
    repositoryStats: {
      totalTheses: 0,
      thisMonth: 0,
      totalDownloads: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  const fetchStats = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch total documents
      const { count: totalDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // Fetch recent documents (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: recentDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Fetch user's uploads
      const { count: myUploads } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch starred documents count
      const starredCount = await StarredService.getStarredCount()

      // Fetch workflow documents (pending, under_review, needs_revision)
      const { count: workflowDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review', 'needs_revision'])

      // Fetch category counts
      const { data: categoryData } = await supabase
        .from('documents')
        .select('program')
        .eq('status', 'published')

      const categoryCounts: Record<string, number> = {}
      if (categoryData) {
        categoryData.forEach(doc => {
          const program = doc.program?.toLowerCase() || 'other'
          categoryCounts[program] = (categoryCounts[program] || 0) + 1
        })
      }

      // Fetch repository stats
      const { count: totalTheses } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      // This month's uploads
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: thisMonth } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      // Total downloads (sum of download_count from all documents)
      const { data: downloadData } = await supabase
        .from('documents')
        .select('download_count')

      const totalDownloads = downloadData?.reduce((sum, doc) => sum + (doc.download_count || 0), 0) || 0

      setStats({
        totalDocuments: totalDocs || 0,
        recentDocuments: recentDocs || 0,
        myUploads: myUploads || 0,
        starredDocuments: starredCount,
        workflowDocuments: workflowDocs || 0,
        categoryCounts,
        repositoryStats: {
          totalTheses: totalTheses || 0,
          thisMonth: thisMonth || 0,
          totalDownloads
        }
      })
    } catch (err) {
      console.error('Error fetching sidebar stats:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
