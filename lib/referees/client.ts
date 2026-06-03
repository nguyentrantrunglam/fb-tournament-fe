import { getClientAuth } from '@/lib/firebase/client'
import type { RefereeWithStats } from '@/lib/types/referee'
import type { SearchUserResult } from '@/app/api/tournaments/[tournamentId]/search-users/route'

export type { SearchUserResult }

async function getToken(): Promise<string> {
  const user = getClientAuth().currentUser
  if (!user) throw new Error('Chưa đăng nhập')
  return user.getIdToken()
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchRefereesWithStats(tid: string): Promise<RefereeWithStats[]> {
  const token = await getToken()
  const res = await fetch(`/api/tournaments/${tid}/referees`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { referees: RefereeWithStats[] }
  return data.referees
}

export async function searchUsers(tid: string, q: string): Promise<SearchUserResult[]> {
  const token = await getToken()
  const res = await fetch(
    `/api/tournaments/${tid}/search-users?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) return []
  const data = (await res.json()) as { users: SearchUserResult[] }
  return data.users
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function batchInviteReferees(tid: string, uids: string[]): Promise<void> {
  const token = await getToken()
  const res = await fetch(`/api/tournaments/${tid}/referees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uids }),
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Có lỗi xảy ra')
  }
}
