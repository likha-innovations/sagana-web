import { createLogger } from './logger'

const logger = createLogger('AuthToken')

type TokenGetter = () => Promise<string | null | undefined>

let activeTokenGetter: TokenGetter | null = null

export function setAuthTokenGetter(getter: TokenGetter | null): void {
  activeTokenGetter = getter
}

export async function getAuthToken(): Promise<string | null> {
  if (activeTokenGetter) {
    try {
      const dynamicToken = await activeTokenGetter()
      if (dynamicToken) {
        return dynamicToken
      }
    } catch (err) {
      logger.warn('Failed to retrieve token from activeTokenGetter', err)
    }
  }
  return null
}
