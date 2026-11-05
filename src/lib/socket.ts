import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/api/client'
import { createLogger } from './logger'

const logger = createLogger('SocketClient')

let socketInstance: Socket | null = null

export function getSocketUrl(): string {
  const cleanBase = API_BASE_URL.replace(/\/$/, '')
  return `${cleanBase}/telemetry`
}

export function getSocket(token?: string | null): Socket {
  if (!socketInstance) {
    const url = getSocketUrl()
    logger.info(`Initializing Socket.IO connection to: ${url}`)

    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: token ? { token } : undefined,
    })

    socketInstance.on('connect', () => {
      logger.info(`Connected to telemetry gateway. Socket ID: ${socketInstance?.id}`)
    })

    socketInstance.on('disconnect', (reason) => {
      logger.warn(`Disconnected from telemetry gateway. Reason: ${reason}`)
    })

    socketInstance.on('connect_error', (err) => {
      logger.warn(`Socket connection error: ${err.message}`)
    })
  } else if (token) {
    socketInstance.auth = { token }
  }

  return socketInstance
}

export function connectSocket(token?: string | null): Socket {
  const socket = getSocket(token)
  if (token) {
    socket.auth = { token }
  }
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
    logger.info('Socket connection destroyed')
  }
}
