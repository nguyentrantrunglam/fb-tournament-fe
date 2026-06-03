'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'
import type { GlobalRole } from './roles'

// SafeUser shape returned by GET /auth/me (no PII)
export type ApiUser = {
  id: string
  email: string
  displayName: string
  gender: 'male' | 'female'
  dob: string
  avatarUrl?: string
  globalRole: GlobalRole
  createdAt: string
}

type AuthState = {
  user: ApiUser | null
  globalRole: GlobalRole | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, globalRole: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, globalRole: null, loading: true })

  useEffect(() => {
    // Probe the session — 401 means no active session (not logged in).
    api.get<ApiUser>('/auth/me')
      .then((user) => {
        setState({ user, globalRole: user.globalRole, loading: false })
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          // Expected: not logged in.
          setState({ user: null, globalRole: null, loading: false })
        } else {
          // Network error or unexpected — treat as not logged in to avoid infinite spinner.
          setState({ user: null, globalRole: null, loading: false })
        }
      })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useCurrentUser(): AuthState {
  return useContext(AuthContext)
}
