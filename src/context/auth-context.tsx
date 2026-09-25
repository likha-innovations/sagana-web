import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth, useUser, useClerk } from '@clerk/react'
import {
  type User,
  type UserRole,
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from '@/types/auth'
import { authApi } from '@/api/auth.api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AuthContext')

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  user: User | null
  role: UserRole
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const clerk = useClerk()

  const [isActionLoading, setIsActionLoading] = useState(false)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isDbLoading, setIsDbLoading] = useState(false)

  // Fetch true backend profile from PostgreSQL (/me) to get accurate database role
  useEffect(() => {
    let isMounted = true
    if (!isSignedIn) {
      setDbUser(null)
      return
    }

    const fetchProfile = async () => {
      try {
        setIsDbLoading(true)
        const token = await getToken()
        if (!token) return
        const profile = await authApi.getProfile(token)
        if (isMounted) {
          setDbUser(profile)
        }
      } catch (err) {
        logger.warn('Failed to fetch DB user profile from /me', err)
      } finally {
        if (isMounted) {
          setIsDbLoading(false)
        }
      }
    }

    void fetchProfile()
    return () => {
      isMounted = false
    }
  }, [isSignedIn, getToken])

  const isLoaded = authLoaded && userLoaded && clerk.loaded && !isActionLoading && !isDbLoading

  // Normalized user object mirroring Prisma model and mobile AuthContext
  const user: User | null = useMemo(() => {
    if (!clerkUser) return null
    const unsafeMeta = (clerkUser.unsafeMetadata || {}) as Record<string, unknown>
    const publicMeta = (clerkUser.publicMetadata || {}) as Record<string, unknown>

    const role = (dbUser?.role || publicMeta.role || unsafeMeta.role || 'user') as UserRole

    return {
      id: clerkUser.id,
      fullName:
        dbUser?.fullName ||
        clerkUser.fullName ||
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        null,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      contactNumber: (dbUser?.contactNumber || unsafeMeta.contactNumber as string) || null,
      location: (dbUser?.location || unsafeMeta.location as string) || null,
      role,
      status: 'active',
    }
  }, [clerkUser, dbUser])

  const role: UserRole = user?.role || 'user'

  const signIn = useCallback(
    async (email: string, password: string) => {
      logger.info(`Initiating custom sign in for ${email}`)
      setIsActionLoading(true)

      try {
        const validated = signInSchema.parse({ email, password })

        if (!clerk.client) {
          throw new Error('Authentication client unavailable')
        }

        const attempt = await clerk.client.signIn.create({
          identifier: validated.email,
          password: validated.password,
        })

        if (attempt.status === 'complete') {
          logger.info(`Sign in complete for ${email}, verifying role permissions`)
          await clerk.setActive({ session: attempt.createdSessionId })

          // Immediate backend verification: query database role
          const token = await clerk.session?.getToken()
          if (token) {
            const profile = await authApi.getProfile(token)
            const allowedRoles: UserRole[] = ['admin', 'superadmin']

            if (!allowedRoles.includes(profile.role)) {
              logger.warn(`Account '${email}' has role '${profile.role}' - access denied`)
              await clerk.signOut()
              setDbUser(null)
              throw new Error('Access denied: Unauthorized account.')
            }

            setDbUser(profile)
          }
        } else {
          logger.warn(`Sign in incomplete, status: ${attempt.status}`)
          throw new Error(
            'Additional verification required. Please check your credentials.'
          )
        }
      } catch (err: unknown) {
        logger.error(`Sign in error for ${email}`, err)
        throw err
      } finally {
        setIsActionLoading(false)
      }
    },
    [clerk]
  )

  const signUp = useCallback(
    async (params: SignUpInput) => {
      logger.info(`Initiating custom sign up for ${params.email}`)
      setIsActionLoading(true)

      try {
        const validated = signUpSchema.parse(params)

        if (!clerk.client) {
          throw new Error('Authentication client unavailable')
        }

        const nameParts = validated.fullName.trim().split(' ')
        const firstName = nameParts[0] || validated.fullName
        const lastName = nameParts.slice(1).join(' ') || ''

        await clerk.client.signUp.create({
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
    [clerk]
  )

  const signOut = useCallback(async () => {
    logger.info('Signing out active user session')
    try {
      await clerk.signOut()
    } catch (err) {
      logger.error('Error during sign out', err)
      throw err
    }
  }, [clerk])

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
