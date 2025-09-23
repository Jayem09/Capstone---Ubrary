import { createContext, useContext, useCallback, useState } from 'react'

interface SidebarStatsContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const SidebarStatsContext = createContext<SidebarStatsContextType | undefined>(undefined)

export function SidebarStatsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    console.log('🔄 Triggering sidebar stats refresh...')
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <SidebarStatsContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </SidebarStatsContext.Provider>
  )
}

export function useSidebarStatsContext() {
  const context = useContext(SidebarStatsContext)
  if (context === undefined) {
    throw new Error('useSidebarStatsContext must be used within a SidebarStatsProvider')
  }
  return context
}
