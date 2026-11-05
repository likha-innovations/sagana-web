import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useAuth, useUser, useClerk } from '@clerk/react'
import { useSignIn, useSignUp } from '@clerk/react/legacy'
import {
  type User,
  type UserRole,
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from '@/types/auth'
import { userApi } from '@/api/user.api'
import { setAuthTokenGetter } from '@/lib/auth-token'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AuthContext')

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  user: User | null
  role: UserRole
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string, keepSignedIn?: boolean) => Promise<void>
  signUp: (params: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerk = useClerk()
  const { isSignedIn, isLoaded: authLoaded, signOut: clerkSignOut, getToken } = useAuth()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const { signIn: clerkSignIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn()
  const { signUp: clerkSignUp } = useSignUp()

  const [isActionLoading, setIsActionLoading] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isProfileFetched, setIsProfileFetched] = useState(false)

  // Enforce session termination on browser close when "Keep me signed in" is unchecked (AC8 & AC9)
  useEffect(() => {
    if (!authLoaded || !isSignedIn) {
      return
    }

    const keepSignedInStored = localStorage.getItem('sagana_keep_signed_in') === 'true'
    const sessionActiveStored = sessionStorage.getItem('sagana_session_active') === 'true'

    if (!keepSignedInStored && !sessionActiveStored) {
      logger.info('Session ended because Keep me signed in was not active and browser closed')
      void clerkSignOut().then(() => {
        setDbUser(null)
        localStorage.removeItem('sagana_keep_signed_in')
        sessionStorage.removeItem('sagana_session_active')
      })
    }
  }, [authLoaded, isSignedIn, clerkSignOut])

  // Automatically wire Clerk's active JWT getter into native apiFetch
  useEffect(() => {
    setAuthTokenGetter(getToken)
  }, [getToken])

  // Fetch backend profile from PostgreSQL (/me) to get database role
  useEffect(() => {
    let isMounted = true
    if (!isSignedIn) {
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
  }, [isSignedIn, getToken])

  const isLoaded =
    authLoaded && userLoaded && signInLoaded && !isActionLoading && (!isSignedIn || isProfileFetched)

  // Normalized user object mirroring Prisma model and mobile AuthContext
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
      logger.info(`Initiating custom sign in for ${email}`)
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

        // If Clerk requests first factor password verification
        if (attempt.status === 'needs_first_factor') {
          attempt = await clerkSignIn.attemptFirstFactor({
            strategy: 'password',
            password: validated.password,
          })
        }

        if (attempt.status === 'complete') {
          logger.info(`Sign in complete for ${email}`)

          // Set storage flags BEFORE activating the session so the
          // session-enforcement useEffect sees them when isSignedIn flips.
          if (keepSignedIn) {
            localStorage.setItem('sagana_keep_signed_in', 'true')
            sessionStorage.removeItem('sagana_session_active')
          } else {
            localStorage.removeItem('sagana_keep_signed_in')
            sessionStorage.setItem('sagana_session_active', 'true')
          }

          await setSignInActive({ session: attempt.createdSessionId })

          // Verify admin role requirement (AC7)
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
            await clerkSignOut()
            setDbUser(null)
            localStorage.removeItem('sagana_keep_signed_in')
            sessionStorage.removeItem('sagana_session_active')
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

  const signUp = useCallback(
    async (params: SignUpInput) => {
      logger.info(`Initiating custom sign up for ${params.email}`)
      setIsActionLoading(true)

      try {
        if (!clerkSignUp) {
          throw new Error('Sign-up service is currently initializing. Please try again.')
        }

        const validated = signUpSchema.parse(params)

        const nameParts = validated.fullName.trim().split(' ')
        const firstName = nameParts[0] || validated.fullName
        const lastName = nameParts.slice(1).join(' ') || ''

        await clerkSignUp.create({
          emailAddress: validated.email,
          password: validated.password,
          firstName,
          lastName,
          unsafeMetadata: {
            role: validated.role,
            contactNumber: validated.contactNumber?.trim() || null,
            location: validated.location?.trim() || null,
          },
        })

        logger.info(`Sign up successful for ${params.email}`)
      } catch (err: unknown) {
        logger.error(`Sign up error for ${params.email}`, err)
        throw err
      } finally {
        setIsActionLoading(false)
      }
    },
    [clerkSignUp]
  )

  const signOut = useCallback(async () => {
    logger.info('Signing out active user session')
    try {
      localStorage.removeItem('sagana_keep_signed_in')
      sessionStorage.removeItem('sagana_session_active')
      await clerkSignOut()
      setDbUser(null)
    } catch (err) {
      logger.error('Error during sign out', err)
      throw err
    }
  }, [clerkSignOut])

  const value = useMemo<AuthContextType>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoaded,
      user,
      role,
      getToken,
      signIn,
      signUp,
      signOut,
    }),
    [isSignedIn, isLoaded, user, role, getToken, signIn, signUp, signOut]
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
