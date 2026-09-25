import { io, type Socket } from 'socket.io-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SocketClient')

let socketInstance: Socket | null = null

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export function getSocketUrl(): string {
  return `${BACKEND_URL.replace(/\/$/, '')}/telemetry`
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = getSocketUrl()
    logger.info(`Initializing Socket.IO connection to: ${url}`)

    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    })
  }

  return socketInstance
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
    logger.info('Socket connection destroyed')
  }
}
