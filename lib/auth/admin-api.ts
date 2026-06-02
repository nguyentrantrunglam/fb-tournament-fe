import { httpsCallable } from 'firebase/functions'
import { getClientFunctions } from '@/lib/firebase/client'
import type { GlobalRole } from './roles'

export type AdminUser = {
  uid: string
  email: string | null
  displayName: string
  gender: 'male' | 'female' | null
  dob: string | null
  globalRole: GlobalRole
  disabled: boolean
  createdAt: number | null
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const fn = httpsCallable<unknown, { users: AdminUser[] }>(getClientFunctions(), 'adminListUsers')
  const res = await fn({})
  return res.data.users
}

export async function adminSetGlobalRole(uid: string, role: GlobalRole): Promise<void> {
  const fn = httpsCallable(getClientFunctions(), 'adminSetGlobalRole')
  await fn({ uid, role })
}

export async function adminUpdateUser(uid: string, data: { displayName: string; phone?: string | undefined }): Promise<void> {
  const fn = httpsCallable(getClientFunctions(), 'adminUpdateUser')
  await fn({ uid, ...data })
}

export async function adminDeleteUser(uid: string): Promise<void> {
  const fn = httpsCallable(getClientFunctions(), 'adminDeleteUser')
  await fn({ uid })
}
