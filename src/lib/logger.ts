export type LogLevel =
  | 'debug'
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'verbose'
  | 'bootstrap'
  | 'route'

export interface LoggerOptions {
  context?: string
  enabled?: boolean
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  stack?: string
  data?: unknown
}

const COLORS = {
  reset: 'color: inherit',
  green: 'color: #10b981; font-weight: bold',
  yellow: 'color: #f59e0b; font-weight: bold',
  red: 'color: #ef4444; font-weight: bold',
  cyan: 'color: #06b6d4; font-weight: bold',
  magenta: 'color: #d946ef; font-weight: bold',
  gray: 'color: #6b7280',
}

const inMemoryLogs: LogEntry[] = []
const MAX_LOGS = 200

function saveToBuffer(entry: LogEntry): void {
  inMemoryLogs.push(entry)
  if (inMemoryLogs.length > MAX_LOGS) {
    inMemoryLogs.shift()
  }
}

function cleanStack(stackOrError?: unknown): string {
  const rawStack =
    stackOrError instanceof Error
      ? stackOrError.stack
      : typeof stackOrError === 'string'
        ? stackOrError
        : ''

  if (!rawStack) return ''

  const frames = rawStack
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith('at ') &&
        !line.includes('node_modules') &&
        !line.includes('logger.ts') &&
        !line.includes('node:internal')
    )
    .slice(0, 3)
    .map((line) => line.replace(/^at\s+/, ''))

  if (frames.length === 0) return ''
  return `\n   ↳ ${frames.join('\n   ↳ ')}`
}

class Logger {
  private context: string
  private enabled: boolean

  constructor(contextOrOptions?: string | LoggerOptions) {
    const isDev = import.meta.env.DEV
    if (typeof contextOrOptions === 'string') {
      this.context = contextOrOptions || 'App'
      this.enabled = isDev
    } else if (contextOrOptions && typeof contextOrOptions === 'object') {
      this.context = contextOrOptions.context || 'App'
      this.enabled = contextOrOptions.enabled ?? isDev
    } else {
      this.context = 'App'
      this.enabled = isDev
    }
  }

  private getTimestamp(): string {
    const now = new Date()
    try {
      return now.toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: 'Asia/Manila',
      })
    } catch {
      return now.toLocaleTimeString('en-US', { hour12: false })
    }
  }

  private resolveParams(
    arg1?: unknown,
    arg2?: unknown
  ): { contextOverride?: string; data?: unknown } {
    if (this.context === 'App' && typeof arg1 === 'string') {
      return { contextOverride: arg1, data: arg2 }
    }
    return { data: arg1 }
  }

  private formatMessage(
    level: string,
    message: string,
    colorStyle: string,
    data?: unknown,
    contextOverride?: string
  ): void {
    if (!this.enabled) return

    const timestamp = this.getTimestamp()
    const pid = 'WEB'
    const ctx = contextOverride || this.context

    // Browser styled console output
    console.log(
      `%c[${pid}] ${timestamp}  ${level.padEnd(5)} %c[${ctx}]%c ${message}`,
      colorStyle,
      COLORS.yellow,
      colorStyle
    )

    if (data !== undefined) {
      console.log(data)
    }
  }

  log(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'log',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('LOG', msgStr, COLORS.green, data, ctx)
  }

  info(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'info',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('INFO', msgStr, COLORS.cyan, data, ctx)
  }

  warn(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'warn',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('WARN', msgStr, COLORS.yellow, data, ctx)
  }

  debug(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'debug',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('DEBUG', msgStr, COLORS.magenta, data, ctx)
  }

  verbose(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'verbose',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('VERB', msgStr, COLORS.cyan, data, ctx)
  }

  error(message: unknown, trace?: unknown, contextOverride?: string): void {
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'error',
      context: ctx,
      message: msgStr,
      stack: trace instanceof Error ? trace.stack : typeof trace === 'string' ? trace : undefined,
    })

    if (!this.enabled) return

    this.formatMessage('ERROR', msgStr, COLORS.red, undefined, ctx)

    if (trace !== undefined) {
      if (trace instanceof Error) {
        const stack = cleanStack(trace)
        const errorText = stack ? `${trace.message}${stack}` : trace.stack || trace.message
        console.error(errorText)
      } else {
        console.error(trace)
      }
    }
  }

  bootstrap(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData)
    const ctx = contextOverride || this.context
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message)

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'bootstrap',
      context: ctx,
      message: msgStr,
      data,
    })

    this.formatMessage('BOOT', msgStr, COLORS.magenta, data, ctx)
  }

  route(routeName: string, params?: Record<string, unknown>): void {
    const msgStr = `Navigated to -> ${routeName}`
    const ctx = this.context === 'App' ? 'Navigation' : this.context

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'route',
      context: ctx,
      message: msgStr,
      data: params,
    })

    this.formatMessage('NAV', msgStr, COLORS.cyan, params, ctx)
  }

  setContext(context: string): void {
    this.context = context
  }

  getContext(): string {
    return this.context
  }

  getLogs(): LogEntry[] {
    return [...inMemoryLogs]
  }

  clearLogs(): void {
    inMemoryLogs.length = 0
  }
}

export function createLogger(contextOrOptions?: string | LoggerOptions): Logger {
  return new Logger(contextOrOptions)
}

export const logger = new Logger()
export { Logger }
