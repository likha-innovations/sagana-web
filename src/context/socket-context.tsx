import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SocketContext')

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  transport: string
  lastPingTime: string | null
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  transport: 'N/A',
  lastPingTime: null,
})

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('N/A')
  const [lastPingTime, setLastPingTime] = useState<string | null>(null)

  useEffect(() => {
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/telemetry`
    logger.info(`Connecting to Socket.IO telemetry namespace: ${targetUrl}`)

    const socketInstance = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      const activeTransport = socketInstance.io.engine.transport.name
      setIsConnected(true)
      setTransport(activeTransport)
      logger.info(`Socket connected successfully (transport: ${activeTransport})`)

      socketInstance.io.engine.on('upgrade', (rawTransport) => {
        setTransport(rawTransport.name)
        logger.debug(`Socket upgraded transport to: ${rawTransport.name}`)
      })
    })

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false)
      setTransport('N/A')
      logger.warn(`Socket disconnected: ${reason}`)
    })

    socketInstance.on('connect_error', (error) => {
      logger.warn(`Socket connection attempt failed: ${error.message}`)
    })

    socketInstance.on('telemetry', (data) => {
      const timeStr = new Date().toLocaleTimeString()
      setLastPingTime(timeStr)
      logger.debug('Received inbound IoT telemetry packet', data)
    })

    socketInstance.on('mqtt:pong', (data) => {
      const timeStr = new Date().toLocaleTimeString()
      setLastPingTime(timeStr)
      logger.info('Received hardware pong from MQTT bridge', data)
    })

    return () => {
      logger.info('Disconnecting socket instance on provider unmount')
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected, transport, lastPingTime }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => useContext(SocketContext)

