import {
  KEEP_SIGNED_IN_KEY,
  TAB_SESSION_KEY,
  clearSessionPersistence,
  persistKeepSignedIn,
  shouldExpireSessionOnBoot,
  type StorageLike,
} from '@/lib/session-persistence'

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

describe('Session Persistence (Keep me signed in)', () => {
  it('keeps session alive across restarts when keepSignedIn is true', () => {
    const local = createMemoryStorage()
    const session = createMemoryStorage()

    persistKeepSignedIn(true, { local, session })

    expect(local.getItem(KEEP_SIGNED_IN_KEY)).toBe('true')
    expect(session.getItem(TAB_SESSION_KEY)).toBeNull()
    expect(shouldExpireSessionOnBoot({ local, session })).toBe(false)
  })

  it('keeps session alive on refresh (tab marker present) when keepSignedIn is false', () => {
    const local = createMemoryStorage()
    const session = createMemoryStorage()

    persistKeepSignedIn(false, { local, session })

    expect(local.getItem(KEEP_SIGNED_IN_KEY)).toBe('false')
    expect(session.getItem(TAB_SESSION_KEY)).toBe('active')
    expect(shouldExpireSessionOnBoot({ local, session })).toBe(false)
  })

  it('expires session on new browser/tab boot when keepSignedIn is false and tab marker is gone', () => {
    const local = createMemoryStorage()
    const session = createMemoryStorage()

    persistKeepSignedIn(false, { local, session })
    const freshSession = createMemoryStorage()

    expect(shouldExpireSessionOnBoot({ local, session: freshSession })).toBe(true)
  })

  it('clears persistence state on sign-out', () => {
    const local = createMemoryStorage()
    const session = createMemoryStorage()

    persistKeepSignedIn(false, { local, session })
    clearSessionPersistence({ local, session })

    expect(local.getItem(KEEP_SIGNED_IN_KEY)).toBeNull()
    expect(session.getItem(TAB_SESSION_KEY)).toBeNull()
    expect(shouldExpireSessionOnBoot({ local, session })).toBe(false)
  })

  it('rolls back localStorage write and returns false if sessionStorage write fails', () => {
    const local = createMemoryStorage()
    local.setItem(KEEP_SIGNED_IN_KEY, 'true')
    const throwingSession: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    }

    const ok = persistKeepSignedIn(false, { local, session: throwingSession })

    expect(ok).toBe(false)
    expect(local.getItem(KEEP_SIGNED_IN_KEY)).toBe('true')
  })

  it('returns false safely when storage getters fail', () => {
    const throwingLocal: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
      removeItem: () => {},
    }
    expect(shouldExpireSessionOnBoot({ local: throwingLocal, session: createMemoryStorage() })).toBe(
      false
    )
  })
})
