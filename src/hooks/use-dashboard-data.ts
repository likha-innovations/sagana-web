import { useState, useEffect, useCallback, useRef } from 'react'
import { initialDashboardData, type DashboardData } from '@/types/dashboard'
import { fetchDashboardData } from '@/api/dashboard.api'
import { useSocketContext } from '@/context/socket-context'

export interface UseDashboardDataResult extends DashboardData {
    isLoading: boolean
    error: string | null
    isConnected: boolean
    refetch: () => Promise<void>
}

let cachedDashboardData: DashboardData | null = null

export function useDashboardData(): UseDashboardDataResult {
    const [data, setData] = useState<DashboardData>(() => cachedDashboardData || initialDashboardData)
    const [isLoading, setIsLoading] = useState(() => !cachedDashboardData)
    const [error, setError] = useState<string | null>(null)
    const { isConnected, lastUpdateTimestamp } = useSocketContext()
    const isFetchingRef = useRef(false)

    // Silent background fetch to prevent UI flashing
    const syncData = useCallback(async (isInitial = false) => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        if (isInitial && !cachedDashboardData) {
            setIsLoading(true)
        }

        try {
            const fetched = await fetchDashboardData()
            cachedDashboardData = fetched
            setData(fetched)
            setError(null)
        } catch (err) {
            if (isInitial && !cachedDashboardData) {
                setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
            } else {
                console.warn('[useDashboardData] Background sync warning:', err)
            }
        } finally {
            if (isInitial) {
                setIsLoading(false)
            }
            isFetchingRef.current = false
        }
    }, [])

    const refetch = useCallback(async () => {
        await syncData(false)
    }, [syncData])

    // 1. Initial fetch on mount
    useEffect(() => {
        void syncData(true)
    }, [syncData])

    // 2. Real-time updates when WebSocket emits telemetry/status/updates
    useEffect(() => {
        if (lastUpdateTimestamp > 0) {
            void syncData(false)
        }
    }, [lastUpdateTimestamp, syncData])

    // 3. Live background poll every 6 seconds so user NEVER needs to refresh
    useEffect(() => {
        const interval = setInterval(() => {
            void syncData(false)
        }, 6000)

        return () => clearInterval(interval)
    }, [syncData])

    // 4. Auto-refresh when user focuses or returns to the browser tab
    useEffect(() => {
        const handleFocus = () => {
            void syncData(false)
        }

        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleFocus)

        return () => {
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleFocus)
        }
    }, [syncData])

    return {
        ...data,
        isLoading,
        error,
        isConnected,
        refetch,
    }
}
