import React from 'react'
import { ClerkProvider } from '@clerk/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/auth-context'
import { SocketProvider } from '@/context/socket-context'
import { BrowserRouter } from 'react-router'
import { logger } from '@/lib/logger'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (!CLERK_PUBLISHABLE_KEY) {
    logger.warn('VITE_CLERK_PUBLISHABLE_KEY is not defined in environment')
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
          <h2 className="text-lg font-bold">Missing Clerk Publishable Key</h2>
          <p className="text-sm mt-2 text-muted-foreground">
            Please add{' '}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
              VITE_CLERK_PUBLISHABLE_KEY
            </code>{' '}
            to your{' '}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
              .env
            </code>{' '}
            file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              {children}
              <Toaster position="top-right" richColors />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
