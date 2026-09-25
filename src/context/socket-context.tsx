import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket, getSocketUrl } from '@/lib/socket'
import { createLogger } from '@/lib/logger'
import type { TelemetryData, RealtimeEventLog } from '@/types'

const logger = createLogger('SocketContext')

export interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  transport: string
  socketId: string | null
  latestTelemetry: TelemetryData | null
  logs: RealtimeEventLog[]
  sendCommand: (commandData: string | object) => boolean
  clearLogs: () => void
  lastPingTime: string | null
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  transport: 'N/A',
  socketId: null,
  latestTelemetry: null,
  logs: [],
  sendCommand: () => false,
  clearLogs: () => {},
  lastPingTime: null,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(() => getSocket().connected)
  const [transport, setTransport] = useState('N/A')
  const [socketId, setSocketId] = useState<string | null>(() => getSocket().id || null)
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null)
  const [logs, setLogs] = useState<RealtimeEventLog[]>([])
  const [lastPingTime, setLastPingTime] = useState<string | null>(null)

  const addLog = useCallback((log: Omit<RealtimeEventLog, 'id'>) => {
    logger.info(log.title, log.payload)
    const newEntry: RealtimeEventLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    }
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)])
  }, [])

  useEffect(() => {
    const socket = getSocket()

    if (!socket.connected) {
      socket.connect()
    }

    const onConnect = () => {
      const activeTransport = socket.io.engine.transport.name
      setIsConnected(true)
      setTransport(activeTransport)
      setSocketId(socket.id || null)
      logger.info(`Socket connected successfully (transport: ${activeTransport})`)

      addLog({
        type: 'connection',
        title: 'Socket.IO Gateway Connected',
        payload: { socketId: socket.id, url: getSocketUrl(), transport: activeTransport },
        timestamp: new Date().toISOString(),
      })

      socket.io.engine.on('upgrade', (rawTransport) => {
        setTransport(rawTransport.name)
        logger.debug(`Socket upgraded transport to: ${rawTransport.name}`)
      })
    }

    const onDisconnect = (reason: string) => {
      setIsConnected(false)
      setTransport('N/A')
      setSocketId(null)
      logger.warn(`Socket disconnected: ${reason}`)

      addLog({
        type: 'connection',
        title: 'Socket.IO Gateway Disconnected',
        payload: { reason },
        timestamp: new Date().toISOString(),
      })
    }

    const onConnectError = (error: Error) => {
      setIsConnected(false)
      logger.warn(`Socket connection attempt failed: ${error.message}`)

      addLog({
        type: 'error',
        title: 'Socket Connection Error',
        payload: { message: error.message },
        timestamp: new Date().toISOString(),
      })
    }

    // Inbound telemetry received from sagana/stream via backend bridge
    const onTelemetry = (data: unknown) => {
      const timeStr = new Date().toLocaleTimeString()
      setLastPingTime(timeStr)

      const payload = typeof data === 'object' && data !== null
        ? (data as TelemetryData)
        : { raw: data }

      setLatestTelemetry(payload)
      addLog({
        type: 'telemetry',
        title: 'Live Telemetry Received (sagana/stream)',
        payload: data,
        timestamp: new Date().toISOString(),
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('telemetry', onTelemetry)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('telemetry', onTelemetry)
    }
  }, [addLog])

  // Dispatches command from frontend to backend -> forwarded to sagana/commands
  const sendCommand = useCallback(
    (commandData: string | object) => {
      const socket = getSocket()
      if (!socket.connected) {
        logger.warn('Cannot send command: Socket is disconnected')
        return false
      }

      let payload: unknown = commandData
      if (typeof commandData === 'string') {
        try {
          payload = JSON.parse(commandData)
        } catch {
          payload = { action: commandData }
        }
      }

      socket.emit('command', payload)
      addLog({
        type: 'command',
        title: 'Command Dispatched (sagana/commands)',
        payload,
        timestamp: new Date().toISOString(),
      })

      return true
    },
    [addLog]
  )

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        isConnected,
        transport,
        socketId,
        latestTelemetry,
        logs,
        sendCommand,
        clearLogs,
        lastPingTime,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => useContext(SocketContext)
export const useSocket = useSocketContext
