'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
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
  /** Re-probe GET /auth/me (e.g. after actions that change the session). */
  refresh: () => Promise<void>
  /** Set the session user directly — call after login/register/logout so the UI
   *  reflects auth state immediately without waiting for a reload/refetch. */
  setUser: (user: ApiUser | null) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  globalRole: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      // 401 (not logged in) and any error → treated as no session.
      const u = await api.get<ApiUser>('/auth/me')
      setUserState(u)
    } catch {
      setUserState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const setUser = useCallback((u: ApiUser | null) => {
    setUserState(u)
    setLoading(false)
  }, [])

  // Probe the session on mount (handles reloads / direct navigation).
  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{ user, globalRole: user?.globalRole ?? null, loading, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useCurrentUser(): AuthState {
  return useContext(AuthContext)
}
