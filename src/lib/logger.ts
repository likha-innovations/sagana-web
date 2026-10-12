export type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error'

const isDev = import.meta.env.DEV

class Logger {
  private ctx: string

  constructor(context = 'App') {
    this.ctx = context
  }

  debug(message: unknown, ...args: unknown[]): void {
    if (isDev) console.debug(`[${this.ctx}]`, message, ...args)
  }

  log(message: unknown, ...args: unknown[]): void {
    if (isDev) console.log(`[${this.ctx}]`, message, ...args)
  }

  info(message: unknown, ...args: unknown[]): void {
    if (isDev) console.info(`[${this.ctx}]`, message, ...args)
  }

  warn(message: unknown, ...args: unknown[]): void {
    console.warn(`[${this.ctx}]`, message, ...args)
  }

  error(message: unknown, ...args: unknown[]): void {
    console.error(`[${this.ctx}]`, message, ...args)
  }

  bootstrap(message: unknown, ...args: unknown[]): void {
    if (isDev) console.info(`[${this.ctx}] 🚀`, message, ...args)
  }
}

export function createLogger(context?: string): Logger {
  return new Logger(context)
}

export const logger = new Logger()
export { Logger }
