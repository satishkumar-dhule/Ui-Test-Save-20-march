import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  basePath: '/api/auth',
})

// Export commonly used hooks and functions
export const { signUp, signIn, signOut, useSession, getSession } = authClient
