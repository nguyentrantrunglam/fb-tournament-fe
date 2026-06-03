import { api } from '@/lib/api/client'
import type { GlobalRole } from './roles'
import { landingPath } from './roles'
import type { ApiUser } from './auth-provider'

// ─── Auth mutations ────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
  nationalId: string
  gender: 'male' | 'female'
  dob: string
  phone?: string
}

export async function signInEmail(email: string, password: string): Promise<ApiUser> {
  return api.post<ApiUser>('/auth/login', { email, password })
}

export async function signUp(payload: RegisterPayload): Promise<ApiUser> {
  return api.post<ApiUser>('/auth/register', payload)
}

export async function signOut(): Promise<void> {
  await api.post<{ ok: boolean }>('/auth/logout')
}

export async function sendResetEmail(email: string): Promise<void> {
  await api.post<{ ok: boolean }>('/auth/forgot-password', { email })
}

// Redirect after login based on globalRole
export function landingForUser(user: ApiUser): string {
  return landingPath(user.globalRole as GlobalRole)
}
