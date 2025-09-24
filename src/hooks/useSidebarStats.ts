import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StarredService } from '../services/starredService'
import { useSidebarStatsContext } from '../contexts/SidebarStatsContext'

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

// Cache for sidebar stats to avoid refetching on every navigation
interface CachedStats {
  data: SidebarStats
  timestamp: number
  userId: string
}

const STATS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let statsCache: CachedStats | null = null

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const { refreshTrigger } = useSidebarStatsContext()
  const fetchedRef = useRef(false)

  const fetchStats = useCallback(async () => {
    if (!user) {
      return
    }

    // Check cache first
    if (statsCache &&
        statsCache.userId === user.id &&
        Date.now() - statsCache.timestamp < STATS_CACHE_DURATION) {
      setStats(statsCache.data)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Run all queries in parallel for better performance
      const [
        totalDocsResult,
        recentDocsResult,
        myUploadsResult,
        starredCount,
        workflowDocsResult,
        categoryData,
        totalThesesResult,
        thisMonthResult,
        downloadData
      ] = await Promise.all([
        // Fetch total documents
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published'),

        // Fetch recent documents (last 7 days)
        (async () => {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .gte('created_at', sevenDaysAgo.toISOString())
        })(),

        // Fetch user's uploads
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),

        // Fetch starred documents count
        StarredService.getStarredCount(),

        // Fetch workflow documents (pending, under_review, needs_revision)
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'under_review', 'needs_revision']),

        // Fetch category counts
        supabase
          .from('documents')
          .select('program')
          .eq('status', 'published'),

        // Fetch repository stats
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true }),

        // This month's uploads
        (async () => {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          return supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString())
        })(),

        // Total downloads (sum of download_count from all documents)
        supabase
          .from('documents')
          .select('download_count')
      ])

      // Calculate category counts
      const categoryCounts: Record<string, number> = {}
      if (categoryData.data) {
        categoryData.data.forEach(doc => {
          const program = doc.program?.toLowerCase() || 'other'
          categoryCounts[program] = (categoryCounts[program] || 0) + 1
        })
      }

      // Calculate total downloads
      const totalDownloads = downloadData.data?.reduce((sum, doc) => sum + (doc.download_count || 0), 0) || 0

      const newStats = {
        totalDocuments: totalDocsResult.count || 0,
        recentDocuments: recentDocsResult.count || 0,
        myUploads: myUploadsResult.count || 0,
        starredDocuments: starredCount,
        workflowDocuments: workflowDocsResult.count || 0,
        categoryCounts,
        repositoryStats: {
          totalTheses: totalThesesResult.count || 0,
          thisMonth: thisMonthResult.count || 0,
          totalDownloads
        }
      }

      // Cache the results
      statsCache = {
        data: newStats,
        timestamp: Date.now(),
        userId: user.id
      }

      setStats(newStats)
    } catch (err) {
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // Only fetch stats if user exists and we haven't fetched yet for this session
    if (user && !fetchedRef.current) {
      fetchedRef.current = true
      fetchStats()
    }
  }, [user, fetchStats])

  // Handle refresh trigger separately to avoid re-fetching on every navigation
  useEffect(() => {
    if (refreshTrigger > 0 && user) {
      // Clear cache and refetch when explicitly requested
      statsCache = null
      fetchedRef.current = false
      fetchStats()
    }
  }, [refreshTrigger, user, fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
