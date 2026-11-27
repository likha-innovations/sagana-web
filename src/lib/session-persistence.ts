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
  try {
    return { local: window.localStorage, session: window.sessionStorage }
  } catch {
    return null
  }
}

export function persistKeepSignedIn(
  keepSignedIn: boolean,
  storages = getBrowserStorages()
): boolean {
  if (!storages) return false

  let prevKeepSignedIn: string | null = null
  let wroteLocal = false

  try {
    prevKeepSignedIn = storages.local.getItem(KEEP_SIGNED_IN_KEY)
    storages.local.setItem(KEEP_SIGNED_IN_KEY, keepSignedIn ? 'true' : 'false')
    wroteLocal = true

    if (keepSignedIn) {
      storages.session.removeItem(TAB_SESSION_KEY)
    } else {
      storages.session.setItem(TAB_SESSION_KEY, 'active')
    }
    return true
  } catch {
    if (wroteLocal) {
      try {
        if (prevKeepSignedIn === null) {
          storages.local.removeItem(KEEP_SIGNED_IN_KEY)
        } else {
          storages.local.setItem(KEEP_SIGNED_IN_KEY, prevKeepSignedIn)
        }
      } catch {
        // Ignore rollback failure when storage itself is locked
      }
    }
    return false
  }
}

export function clearSessionPersistence(storages = getBrowserStorages()): void {
  if (!storages) return
  try {
    storages.local.removeItem(KEEP_SIGNED_IN_KEY)
  } catch {
    // Ignore storage unavailability during cleanup
  }
  try {
    storages.session.removeItem(TAB_SESSION_KEY)
  } catch {
    // Ignore storage unavailability during cleanup
  }
}

export function shouldExpireSessionOnBoot(storages = getBrowserStorages()): boolean {
  if (!storages) return false
  try {
    return (
      storages.local.getItem(KEEP_SIGNED_IN_KEY) === 'false' &&
      storages.session.getItem(TAB_SESSION_KEY) !== 'active'
    )
  } catch {
    return false
  }
}
