import { api } from '@/lib/api/client'
import type { RefereeWithStats } from '@/lib/types/referee'

// Shape returned by GET /tournaments/:tid/search-users?q=
// Api returns {id, displayName, gender, avatarUrl} — no email/phone (PII rules).
export type SearchUserResult = {
  id: string         // MongoDB ObjectId string (was uid in Firebase)
  displayName: string
  gender: 'male' | 'female' | null
  avatarUrl: string | null
  // email and phone are intentionally absent — api strips them (PII rules).
  // UI that previously displayed email/phone will show displayName only.
  email?: string     // kept optional so InviteRefereeDialog template still compiles
  phone?: string
  // Legacy alias: some call-sites use .uid — map from id on read
  uid?: string
}

// Api referee shape from GET /tournaments/:tid/referees
type ApiReferee = {
  userId: string
  displayName: string
  avatarUrl: string | null
  gender: 'male' | 'female' | null
  assignedCourts: string[]
  grantedAt: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchRefereesWithStats(tid: string): Promise<RefereeWithStats[]> {
  try {
    const res = await api.get<{ referees: ApiReferee[] }>(`/tournaments/${tid}/referees`)
    return (res.referees ?? []).map((r) => ({
      uid: r.userId,         // RefereeWithStats.uid maps to userId from api
      tournamentId: tid,
      displayName: r.displayName,
      phone: '',             // phone not returned by api (PII); hide in UI
      avatarUrl: r.avatarUrl,
      status: r.assignedCourts.length > 0 ? 'online' : 'available',
      assignedCourts: r.assignedCourts,
      matchesTodayCount: 0,  // not yet computed by api (Phase 5+)
      lastSeenLabel: null,   // Socket.IO presence not yet wired (Phase 5+)
    }))
  } catch {
    return []
  }
}

export async function searchUsers(tid: string, q: string): Promise<SearchUserResult[]> {
  try {
    const res = await api.get<{ users: SearchUserResult[] }>(
      `/tournaments/${tid}/search-users?q=${encodeURIComponent(q)}`,
    )
    // Attach uid alias so existing call-sites using user.uid keep working
    return (res.users ?? []).map((u) => ({ ...u, uid: u.id }))
  } catch {
    return []
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

// Grant referee role by userId (was batchInviteReferees with uid[] in Firebase).
// Api grants one at a time via POST /tournaments/:tid/referees { userId }.
// We keep the batch signature for call-site compatibility and fan out serially.
export async function batchInviteReferees(tid: string, userIds: string[]): Promise<void> {
  // Fan out — api processes one grant per request (no bulk endpoint yet)
  await Promise.all(
    userIds.map((userId) =>
      api.post<unknown>(`/tournaments/${tid}/referees`, { userId }),
    ),
  )
}
