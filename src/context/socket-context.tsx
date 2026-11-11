import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket } from '@/lib/socket'
import { useAuthContext } from './auth-context'
import { createLogger } from '@/lib/logger'
import { machineKeys } from '@/hooks/use-machines'
import { batchKeys } from '@/hooks/use-batches'
import { dashboardKeys } from '@/hooks/use-dashboard-data'
import { operatorKeys } from '@/hooks/use-operators'

const logger = createLogger('SocketContext')

export interface TelemetryPayload {
  machineId: string
  macAddress: string
  name: string
  barangayId: string
  timestamp: string
  bme280?: {
    temp: number
    humidity: number
    pressure: number
  }
  ds18b20?: {
    probe1: number
    probe2: number
    probe3: number
  }
  scd41?: {
    co2: number
  }
  o2?: number
  moisture?: {
    sensor1: number
    sensor2: number
  }
  [key: string]: unknown
}

export interface MachineStatusPayload {
  machineId: string
  macAddress: string
  status: 'active' | 'offline' | 'online'
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  lastTelemetry: TelemetryPayload | null
  lastStatus: MachineStatusPayload | null
  lastUpdateTimestamp: number
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastTelemetry: null,
  lastStatus: null,
  lastUpdateTimestamp: 0,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { getToken } = useAuthContext()
  const [isConnected, setIsConnected] = useState(false)
  const [lastTelemetry, setLastTelemetry] = useState<TelemetryPayload | null>(null)
  const [lastStatus, setLastStatus] = useState<MachineStatusPayload | null>(null)
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0)

  // Stable ref for getToken to avoid re-running the effect when Clerk re-renders
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let isMounted = true

    // Connect socket (token is sent asynchronously after connection)
    const socket = connectSocket()
    socketRef.current = socket

    // Sync initial connected state
    if (socket.connected) {
      setIsConnected(true)
      logger.info('Socket already connected on mount')
    }

    // Fetch and attach token seamlessly without disrupting active connection
    void getTokenRef.current().then((token) => {
      if (!isMounted) return
      if (token) {
        socket.auth = { token }
      }
      if (!socket.connected) {
        socket.connect()
      }
    })

    let lastThrottle = 0
    let throttleTimeout: NodeJS.Timeout | null = null

    // Throttled timestamp updater to prevent rapid UI thrashing/flickering
    const notifyUpdate = () => {
      const now = Date.now()
      if (now - lastThrottle > 2000) {
        lastThrottle = now
        if (isMounted) {
          setLastUpdateTimestamp(now)
          void queryClient.invalidateQueries({ queryKey: machineKeys.all })
          void queryClient.invalidateQueries({ queryKey: batchKeys.all })
          void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
          void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
        }
      } else if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
          lastThrottle = Date.now()
          if (isMounted) {
            setLastUpdateTimestamp(Date.now())
            void queryClient.invalidateQueries({ queryKey: machineKeys.all })
            void queryClient.invalidateQueries({ queryKey: batchKeys.all })
            void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
            void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
          }
        }, 2000)
      }
    }

    const handleConnect = () => {
      if (isMounted) {
        setIsConnected(true)
        logger.info(`WebSocket connected (id: ${socket.id})`)
        notifyUpdate()
      }
    }

    const handleDisconnect = (reason: string) => {
      if (isMounted) {
        setIsConnected(false)
        logger.warn(`WebSocket disconnected: ${reason}`)
      }
    }

    const handleConnectError = (err: Error) => {
      logger.warn(`WebSocket connect_error: ${err.message}`)
    }

    const handleTelemetry = (data: TelemetryPayload) => {
      if (isMounted) {
        setLastTelemetry(data)
        // Telemetry updates sensor data; throttle notification to avoid spamming table refetches
        notifyUpdate()
      }
    }

    const handleStatus = (data: MachineStatusPayload) => {
      if (isMounted) {
        logger.info(`📥 Received status event: ${data.macAddress} → ${data.status}`)
        setLastStatus(data)
        notifyUpdate()
      }
    }

    const handleDashboardUpdate = () => {
      if (isMounted) {
        logger.info('📥 Received dashboard:update event → triggering data refresh')
        notifyUpdate()
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('telemetry', handleTelemetry)
    socket.on('status', handleStatus)
    socket.on('dashboard:update', handleDashboardUpdate)

    return () => {
      isMounted = false
      if (throttleTimeout) clearTimeout(throttleTimeout)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('telemetry', handleTelemetry)
      socket.off('status', handleStatus)
      socket.off('dashboard:update', handleDashboardUpdate)
    }
  }, []) // Stable effect — no dependency on getToken

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        lastTelemetry,
        lastStatus,
        lastUpdateTimestamp,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  return useContext(SocketContext)
}
