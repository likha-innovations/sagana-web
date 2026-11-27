import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useAuth, useUser, useClerk, useSession } from '@clerk/react'
import { useSignIn } from '@clerk/react/legacy'
import {
  type User,
  type UserRole,
  type UpdateProfileInput,
  signInSchema,
  verifyCodeSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from '@/types/auth'
import { userApi } from '@/api/user.api'
import { setAuthTokenGetter } from '@/lib/auth-token'
import { createLogger } from '@/lib/logger'
import {
  clearSessionPersistence,
  requireKeepSignedInPersistence,
  shouldExpireSessionOnBoot,
} from '@/lib/session-persistence'
import { extractClerkErrorMessage, isClerkSessionExistsError } from '@/lib/password-reset'

const logger = createLogger('AuthContext')

export type ResetPrepStatus = 'idle' | 'pending' | 'sent' | 'failed'

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  resetPrepStatus: ResetPrepStatus
  resetPrepError: string | null
  clearResetPrep: () => void
  user: User | null
  role: UserRole
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string, keepSignedIn?: boolean) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  preparePasswordReset: (email: string) => Promise<void>
  verifyPasswordResetCode: (code: string) => Promise<void>
  resetPassword: (newPassword: string, code?: string) => Promise<void>
  verifyCurrentPassword: (currentPassword: string) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<User>
  signOut: (options?: { skipRedirect?: boolean }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerk = useClerk()
  const { isSignedIn, isLoaded: authLoaded, signOut: clerkSignOut, getToken } = useAuth()
  const { session } = useSession()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const { signIn: clerkSignIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn()

  const [isActionLoading, setIsActionLoading] = useState(false)
  const [resetPrepStatus, setResetPrepStatus] = useState<ResetPrepStatus>('idle')
  const [resetPrepError, setResetPrepError] = useState<string | null>(null)
  const [bootSignOutError, setBootSignOutError] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isProfileFetched, setIsProfileFetched] = useState(false)
  const isExpiringBootSessionRef = useRef(false)

  const needsSessionExpiry = Boolean(authLoaded && isSignedIn && shouldExpireSessionOnBoot())

  useEffect(() => {
    setAuthTokenGetter(getToken)
  }, [getToken])

  const expireBootSession = useCallback(() => {
    if (isExpiringBootSessionRef.current) return
    isExpiringBootSessionRef.current = true
    setBootSignOutError(false)
    logger.info('Expiring non-persistent session after browser/tab restart')
    void clerkSignOut(() => {})
      .then(() => {
        clearSessionPersistence()
        setDbUser(null)
        setIsProfileFetched(false)
      })
      .catch((err) => {
        logger.warn('Failed to expire non-persistent session on boot', err)
        setBootSignOutError(true)
      })
      .finally(() => {
        isExpiringBootSessionRef.current = false
      })
  }, [clerkSignOut])

  useEffect(() => {
    if (!needsSessionExpiry || bootSignOutError) {
      return
    }
    expireBootSession()
  }, [needsSessionExpiry, bootSignOutError, expireBootSession])

  useEffect(() => {
    let isMounted = true
    if (!isSignedIn || needsSessionExpiry) {
      return
    }

    const fetchProfile = async () => {
      try {
        const profile = await userApi.getProfile()
        if (isMounted) {
          setDbUser(profile)
        }
      } catch (err) {
        logger.warn('Failed to fetch DB user profile from /me', err)
      } finally {
        if (isMounted) {
          setIsProfileFetched(true)
        }
      }
    }

    void fetchProfile()
    return () => {
      isMounted = false
    }
  }, [isSignedIn, needsSessionExpiry, getToken])

  const isLoaded =
    authLoaded &&
    userLoaded &&
    signInLoaded &&
    !isActionLoading &&
    !needsSessionExpiry &&
    (!isSignedIn || isProfileFetched)

  const user: User | null = useMemo(() => {
    if (!clerkUser) return null
    const unsafeMeta = (clerkUser.unsafeMetadata || {}) as Record<string, unknown>
    const publicMeta = (clerkUser.publicMetadata || {}) as Record<string, unknown>

    const role = (dbUser?.role || publicMeta.role || unsafeMeta.role || 'operator') as UserRole

    return {
      id: clerkUser.id,
      fullName:
        dbUser?.fullName ||
        clerkUser.fullName ||
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        null,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      contactNumber: (dbUser?.contactNumber || (unsafeMeta.contactNumber as string)) || null,
      location: (dbUser?.location || (unsafeMeta.location as string)) || null,
      role,
      status: 'active',
    }
  }, [clerkUser, dbUser])

  const role: UserRole = user?.role || 'operator'

  const withCleanClerkSession = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn()
      } catch (err: unknown) {
        if (!isClerkSessionExistsError(err)) throw err
        logger.warn('Clearing stale Clerk session before retrying auth action')
        await clerkSignOut(() => {})
        clearSessionPersistence()
        return fn()
      }
    },
    [clerkSignOut]
  )

  const signIn = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      logger.info(`Initiating sign in for ${email}`)
      setIsActionLoading(true)

      try {
        if (!clerkSignIn) {
          throw new Error('Sign-in service is currently initializing. Please try again.')
        }

        const validated = signInSchema.parse({ email, password })

        let attempt = await withCleanClerkSession(() =>
          clerkSignIn.create({
            identifier: validated.email,
            password: validated.password,
          })
        )

        if (attempt.status === 'needs_first_factor') {
          attempt = await clerkSignIn.attemptFirstFactor({
            strategy: 'password',
            password: validated.password,
          })
        }

        if (attempt.status === 'complete') {
          logger.info(`Sign in complete for ${email}`)

          requireKeepSignedInPersistence(keepSignedIn)
          await setSignInActive({ session: attempt.createdSessionId })

          let verifiedRole: string | null = null

          try {
            setAuthTokenGetter(getToken)
            const profile = await userApi.getProfile()
            if (profile) {
              setDbUser(profile)
              verifiedRole = profile.role
            }
          } catch (profileErr) {
            logger.warn('Failed to fetch DB user profile from /me during sign in', profileErr)
          }

          if (!verifiedRole) {
            const session = clerk.client?.sessions?.find((s) => s.id === attempt.createdSessionId)
            const sessionUser = session?.user || clerk.user
            const publicMeta = (sessionUser?.publicMetadata || {}) as Record<string, unknown>
            const unsafeMeta = (sessionUser?.unsafeMetadata || {}) as Record<string, unknown>
            verifiedRole = (publicMeta.role || unsafeMeta.role) as string | null
          }

          if (verifiedRole && verifiedRole !== 'admin') {
            logger.warn(`User ${email} has role '${verifiedRole}', not 'admin'. Rejecting sign-in.`)
            await clerkSignOut(() => {})
            clearSessionPersistence()
            setDbUser(null)
            setIsProfileFetched(false)
            throw new Error('Incorrect credentials, try again')
          }

          return
        }

        logger.warn(`Sign in incomplete, status: ${attempt.status}`)
        throw new Error(
          `Sign-in incomplete (status: ${attempt.status}). Please check your credentials.`
        )
      } catch (err: unknown) {
        logger.error(`Sign in error for ${email}`, err)
        throw err
      } finally {
        setIsActionLoading(false)
      }
    },
    [clerkSignIn, setSignInActive, clerk, getToken, clerkSignOut, withCleanClerkSession]
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const signInResource = clerk.client?.signIn ?? clerkSignIn
      if (!signInResource) {
        throw new Error('Password reset service is currently initializing. Please try again.')
      }

      const validated = resetPasswordRequestSchema.parse({ email })
      await withCleanClerkSession(() =>
        signInResource.create({
          strategy: 'reset_password_email_code',
          identifier: validated.email,
        })
      )
      logger.info(`Password reset email sent to ${validated.email}`)
    },
    [clerk, clerkSignIn, withCleanClerkSession]
  )

  const verifyPasswordResetCode = useCallback(
    async (code: string) => {
      const signInResource = clerk.client?.signIn ?? clerkSignIn
      if (!signInResource) {
        throw new Error('Password reset service is currently initializing. Please try again.')
      }

      const validated = verifyCodeSchema.parse({ code })
      const result = await signInResource.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: validated.code,
      })

      if (result.status !== 'needs_new_password' && result.status !== 'complete') {
        logger.warn('Password reset code verification returned unexpected status', result.status)
        throw new Error(
          result.status ? `Verification failed with status: ${result.status}` : 'Verification failed'
        )
      }

      logger.info('Password reset code verified successfully')
    },
    [clerk, clerkSignIn]
  )

  const resetPassword = useCallback(
    async (newPassword: string, code?: string) => {
      const signInResource = clerk.client?.signIn ?? clerkSignIn
      if (!signInResource) {
        throw new Error('Password reset service is currently initializing. Please try again.')
      }

      const trimmedCode = code?.trim()
      let result

      if (signInResource.status === 'needs_new_password') {
        result = await signInResource.resetPassword({ password: newPassword })
      } else if (trimmedCode) {
        const validated = resetPasswordConfirmSchema.parse({
          code: trimmedCode,
          password: newPassword,
        })
        result = await signInResource.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: validated.code,
          password: validated.password,
        })
      } else {
        result = await signInResource.resetPassword({ password: newPassword })
      }

      if (result.status !== 'complete') {
        logger.warn('Password reset incomplete', result.status)
        throw new Error('Password reset incomplete. Please try again.')
      }

      // ponytail: clear Clerk's auto-created session so web renders 'You are all set!' and verifies admin role on /sign-in
      if (result.createdSessionId) {
        try {
          await clerkSignOut(() => {}, { sessionId: result.createdSessionId })
        } catch (signOutErr) {
          logger.warn('Failed to clear password-reset session by ID, signing out client', signOutErr)
          await clerkSignOut(() => {})
        }
      } else {
        await clerkSignOut(() => {})
      }
      clearSessionPersistence()
      setDbUser(null)
      setIsProfileFetched(false)

      logger.info('Password reset complete')
    },
    [clerk, clerkSignIn, clerkSignOut]
  )

  const verifyCurrentPassword = useCallback(
    async (currentPassword: string) => {
      if (!session) {
        throw new Error('Active session not found. Please sign in again.')
      }

      await session.startVerification({ level: 'first_factor' })
      const verification = await session.attemptFirstFactorVerification({
        strategy: 'password',
        password: currentPassword,
      })

      if (verification.status !== 'complete') {
        throw new Error('Current password verification incomplete')
      }
    },
    [session]
  )

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!clerkUser) {
        throw new Error('User session is not loaded')
      }

      await clerkUser.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      })
      logger.info('Password updated successfully for active user')
    },
    [clerkUser]
  )

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    const updated = await userApi.updateProfile(data)
    setDbUser(updated)
    return updated
  }, [])

  const signOut = useCallback(
    async (options?: { skipRedirect?: boolean }) => {
      logger.info('Signing out active user session')
      try {
        // ponytail: passing a callback suppresses Clerk's default redirect to '/' (-> '/sign-in')
        if (options?.skipRedirect) {
          await clerkSignOut(() => {})
        } else {
          await clerkSignOut()
        }
        clearSessionPersistence()
        setDbUser(null)
        setIsProfileFetched(false)
      } catch (err) {
        logger.error('Error during sign out', err)
        throw err
      }
    },
    [clerkSignOut]
  )

  const clearResetPrep = useCallback(() => {
    setResetPrepStatus('idle')
    setResetPrepError(null)
  }, [])

  const preparePasswordReset = useCallback(
    async (email: string) => {
      setResetPrepStatus('pending')
      setResetPrepError(null)
      try {
        await clerkSignOut(() => {})
        clearSessionPersistence()
        setDbUser(null)
        setIsProfileFetched(false)
        await requestPasswordReset(email)
        setResetPrepStatus('sent')
      } catch (err: unknown) {
        const message = extractClerkErrorMessage(
          err,
          'Unable to send verification code. Please try again.'
        )
        setResetPrepStatus('failed')
        setResetPrepError(message)
        throw err
      }
    },
    [clerkSignOut, requestPasswordReset]
  )

  const value = useMemo<AuthContextType>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoaded,
      resetPrepStatus,
      resetPrepError,
      clearResetPrep,
      user,
      role,
      getToken,
      signIn,
      requestPasswordReset,
      preparePasswordReset,
      verifyPasswordResetCode,
      resetPassword,
      verifyCurrentPassword,
      updatePassword,
      updateProfile,
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      resetPrepStatus,
      resetPrepError,
      clearResetPrep,
      user,
      role,
      getToken,
      signIn,
      requestPasswordReset,
      preparePasswordReset,
      verifyPasswordResetCode,
      resetPassword,
      verifyCurrentPassword,
      updatePassword,
      updateProfile,
      signOut,
    ]
  )

  if (needsSessionExpiry && bootSignOutError) {
    return (
      <div className="flex h-screen items-center justify-center bg-page p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-border bg-[#FDFCF7] p-6 shadow-card space-y-3">
          <h2 className="text-base font-bold text-foreground">Session expired</h2>
          <p className="text-xs text-text-email">
            We couldn&apos;t sign out your previous session automatically. Retry to continue to sign in.
          </p>
          <button
            type="button"
            onClick={expireBootSession}
            className="h-10 rounded-full bg-primary px-5 text-xs font-semibold text-white hover:bg-[#627920] cursor-pointer"
          >
            Retry sign out
          </button>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
