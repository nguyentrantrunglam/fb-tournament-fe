import { api } from '@/lib/api/client'
import type { RegistrationRow, EditableStatus } from '@/lib/types/registration'

// ─── Response shapes ───────────────────────────────────────────────────────────

export type RegistrationsListResponse = {
  registrations: RegistrationRow[]
  totalCount: number
}

export type CreateRegistrationResponse = { id: string }
export type ActionResponse = { ok: boolean }

export type BulkRegisterSuccessItem = { rowIndex: number; registrationId: string }
export type BulkRegisterErrorItem = { rowIndex: number; code: string; message: string }
export type BulkRegisterResponse = {
  success: BulkRegisterSuccessItem[]
  errors: BulkRegisterErrorItem[]
}

export type SearchUsersResult = {
  id: string
  displayName: string
  gender: 'male' | 'female' | null
  avatarUrl: string | null
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function fetchRegistrations(tid: string): Promise<RegistrationsListResponse> {
  return api.get<RegistrationsListResponse>(`/tournaments/${tid}/registrations`)
}

export async function searchRegistrationUsers(
  tid: string,
  q: string,
  gender?: string,
): Promise<SearchUsersResult[]> {
  const params = new URLSearchParams({ q })
  if (gender) params.set('gender', gender)
  try {
    const res = await api.get<{ users: SearchUsersResult[] }>(
      `/tournaments/${tid}/registration-search-users?${params.toString()}`,
    )
    return res.users ?? []
  } catch {
    return []
  }
}

export async function searchOrganizerUsers(
  tid: string,
  q: string,
  gender?: string,
): Promise<SearchUsersResult[]> {
  const params = new URLSearchParams({ q })
  if (gender) params.set('gender', gender)
  try {
    const res = await api.get<{ users: SearchUsersResult[] }>(
      `/tournaments/${tid}/organizer/user-search?${params.toString()}`,
    )
    return res.users ?? []
  } catch {
    return []
  }
}

// ─── Self registration (current session user is primary) ──────────────────────

export async function createSelfRegistration(
  categoryId: string,
  partnerUserId?: string,
): Promise<CreateRegistrationResponse> {
  return api.post<CreateRegistrationResponse>(
    `/categories/${categoryId}/registrations`,
    partnerUserId ? { partnerUserId } : {},
  )
}

// ─── Organizer creates on behalf of an athlete (auto-approved) ────────────────

export async function createOrganizerRegistration(
  categoryId: string,
  primaryUserId: string,
  partnerUserId?: string,
): Promise<CreateRegistrationResponse> {
  return api.post<CreateRegistrationResponse>(
    `/categories/${categoryId}/registrations/organizer`,
    partnerUserId ? { primaryUserId, partnerUserId } : { primaryUserId },
  )
}

// ─── Bulk register (organizer, ≤50 rows) ─────────────────────────────────────

export type BulkRow = { categoryId: string; primaryUserId: string; partnerUserId?: string }

export async function bulkRegister(
  tid: string,
  rows: BulkRow[],
): Promise<BulkRegisterResponse> {
  return api.post<BulkRegisterResponse>(`/tournaments/${tid}/registrations/bulk`, { rows })
}

// ─── State transitions ────────────────────────────────────────────────────────

/**
 * Organizer free-edit of registration status (pending/approved/rejected).
 * Backend enforces slot accounting + atomic transitions. Errors (CATEGORY_FULL,
 * CONFLICT, INVALID_LIFECYCLE_TRANSITION) surface via the global mutation toast.
 */
export async function setRegistrationStatus(
  rid: string,
  status: EditableStatus,
  reason?: string,
): Promise<ActionResponse> {
  return api.patch<ActionResponse>(
    `/registrations/${rid}/status`,
    reason ? { status, reason } : { status },
  )
}

export async function withdrawRegistration(rid: string): Promise<ActionResponse> {
  return api.post<ActionResponse>(`/registrations/${rid}/withdraw`)
}

// ─── Config: seed + team photo ────────────────────────────────────────────────

export async function setSeed(rid: string, seed: number | null): Promise<ActionResponse> {
  return api.patch<ActionResponse>(`/registrations/${rid}/seed`, { seed })
}

export async function setTeamPhoto(rid: string, url: string): Promise<ActionResponse> {
  return api.patch<ActionResponse>(`/registrations/${rid}/team-photo`, { url })
}

// ─── Presign upload for team photos ──────────────────────────────────────────

export async function presignTeamPhoto(
  tid: string,
  registrationId: string,
  ext: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = `tournaments/${tid}/teams/${registrationId}.${ext}`
  return api.post<{ uploadUrl: string; publicUrl: string }>('/storage/presign', {
    key,
    contentType,
  })
}
