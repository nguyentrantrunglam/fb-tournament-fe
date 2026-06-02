'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'
import type { GlobalRole } from './roles'

type AuthState = {
  user: User | null
  globalRole: GlobalRole | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, globalRole: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, globalRole: null, loading: true })

  useEffect(() => {
    const unsub = onAuthStateChanged(getClientAuth(), async (user) => {
      if (!user) {
        setState({ user: null, globalRole: null, loading: false })
        return
      }
      // globalRole đọc từ custom claim (admin set qua seed/CF). Mặc định 'user'.
      const token = await user.getIdTokenResult()
      const role = (token.claims['globalRole'] as GlobalRole) ?? 'user'
      setState({ user, globalRole: role, loading: false })
    })
    return () => unsub()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useCurrentUser(): AuthState {
  return useContext(AuthContext)
}
