import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useAuth, useUser, useClerk, useSession } from '@clerk/react'
import { useSignIn } from '@clerk/react/legacy'
import {
  type User,
  type UserRole,
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
  persistKeepSignedIn,
  shouldExpireSessionOnBoot,
} from '@/lib/session-persistence'

const logger = createLogger('AuthContext')

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  isPreparingReset: boolean
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
  const [isPreparingReset, setIsPreparingReset] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isProfileFetched, setIsProfileFetched] = useState(false)
  const isExpiringBootSessionRef = useRef(false)

  const needsSessionExpiry = Boolean(authLoaded && isSignedIn && shouldExpireSessionOnBoot())

  useEffect(() => {
    setAuthTokenGetter(getToken)
  }, [getToken])

  useEffect(() => {
    if (!needsSessionExpiry || isExpiringBootSessionRef.current) {
      return
    }
    isExpiringBootSessionRef.current = true
    logger.info('Expiring non-persistent session after browser/tab restart')
    void clerkSignOut(() => {})
      .catch((err) => {
        logger.warn('Failed to expire non-persistent session on boot', err)
      })
      .finally(() => {
        clearSessionPersistence()
        setDbUser(null)
        setIsProfileFetched(false)
        isExpiringBootSessionRef.current = false
      })
  }, [needsSessionExpiry, clerkSignOut])

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

  const signIn = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      logger.info(`Initiating sign in for ${email}`)
      setIsActionLoading(true)

      try {
        if (!clerkSignIn) {
          throw new Error('Sign-in service is currently initializing. Please try again.')
        }

        const validated = signInSchema.parse({ email, password })

        let attempt = await clerkSignIn.create({
          identifier: validated.email,
          password: validated.password,
        })

        if (attempt.status === 'needs_first_factor') {
          attempt = await clerkSignIn.attemptFirstFactor({
            strategy: 'password',
            password: validated.password,
          })
        }

        if (attempt.status === 'complete') {
          logger.info(`Sign in complete for ${email}`)

          persistKeepSignedIn(keepSignedIn)
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
    [clerkSignIn, setSignInActive, clerk, getToken, clerkSignOut]
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const signInResource = clerk.client?.signIn ?? clerkSignIn
      if (!signInResource) {
        throw new Error('Password reset service is currently initializing. Please try again.')
      }

      const validated = resetPasswordRequestSchema.parse({ email })
      await signInResource.create({
        strategy: 'reset_password_email_code',
        identifier: validated.email,
      })
      logger.info(`Password reset email sent to ${validated.email}`)
    },
    [clerk, clerkSignIn]
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

      // ponytail: keep session inactive so web renders 'You are all set!' and verifies admin role on /sign-in
      logger.info('Password reset complete')
    },
    [clerk, clerkSignIn]
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

  const preparePasswordReset = useCallback(
    async (email: string) => {
      setIsPreparingReset(true)
      try {
        await clerkSignOut(() => {})
        clearSessionPersistence()
        setDbUser(null)
        setIsProfileFetched(false)
        await requestPasswordReset(email)
      } finally {
        setIsPreparingReset(false)
      }
    },
    [clerkSignOut, requestPasswordReset]
  )

  const value = useMemo<AuthContextType>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoaded,
      isPreparingReset,
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
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      isPreparingReset,
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
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
