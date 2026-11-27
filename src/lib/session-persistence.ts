// ponytail: minimal storage-based session lifetime guard since Clerk <ClerkProvider> has no per-login cookie maxAge toggle

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export const KEEP_SIGNED_IN_KEY = 'sagana_keep_signed_in'
export const TAB_SESSION_KEY = 'sagana_tab_session'

function getBrowserStorages(): { local: StorageLike; session: StorageLike } | null {
  if (typeof window === 'undefined') return null
  return { local: window.localStorage, session: window.sessionStorage }
}

export function persistKeepSignedIn(
  keepSignedIn: boolean,
  storages = getBrowserStorages()
): void {
  if (!storages) return
  storages.local.setItem(KEEP_SIGNED_IN_KEY, keepSignedIn ? 'true' : 'false')
  if (keepSignedIn) {
    storages.session.removeItem(TAB_SESSION_KEY)
  } else {
    storages.session.setItem(TAB_SESSION_KEY, 'active')
  }
}

export function clearSessionPersistence(storages = getBrowserStorages()): void {
  if (!storages) return
  storages.local.removeItem(KEEP_SIGNED_IN_KEY)
  storages.session.removeItem(TAB_SESSION_KEY)
}

export function shouldExpireSessionOnBoot(storages = getBrowserStorages()): boolean {
  if (!storages) return false
  return (
    storages.local.getItem(KEEP_SIGNED_IN_KEY) === 'false' &&
    storages.session.getItem(TAB_SESSION_KEY) !== 'active'
  )
}
