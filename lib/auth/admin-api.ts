import { api } from '@/lib/api/client'
import type { GlobalRole } from './roles'

// Shape returned by GET /admin/users (SafeUser without identity)
export type AdminUser = {
  id: string
  email: string
  displayName: string
  gender: 'male' | 'female' | null
  dob: string | null
  globalRole: GlobalRole
  createdAt: string | null
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const res = await api.get<{ users: AdminUser[]; total: number }>('/admin/users?limit=200')
  return res.users
}

export async function adminSetGlobalRole(id: string, role: GlobalRole): Promise<void> {
  await api.patch<AdminUser>(`/admin/users/${id}/role`, { role })
}

// Admin profile-edit + delete-user endpoints aren't in the NestJS api yet (the old
// Firebase build had them). Fail VISIBLY instead of silently pretending success, so
// the UI surfaces an error rather than lying that it saved. Restore by adding
// PATCH /admin/users/:id and DELETE /admin/users/:id to the api, then wiring here.
const NOT_AVAILABLE = 'Tính năng này đang được hoàn thiện trên hệ thống mới.'

export async function adminUpdateUser(_id: string, _data: { displayName: string; phone?: string }): Promise<void> {
  throw new Error(NOT_AVAILABLE)
}

export async function adminDeleteUser(_id: string): Promise<void> {
  throw new Error(NOT_AVAILABLE)
}
