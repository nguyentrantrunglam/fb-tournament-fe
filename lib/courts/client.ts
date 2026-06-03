import { getClientAuth } from '@/lib/firebase/client'
import type { CourtWithState, RefereeOption } from '@/lib/types/court'

async function getToken(): Promise<string> {
  const user = getClientAuth().currentUser
  if (!user) throw new Error('Chưa đăng nhập')
  return user.getIdToken()
}

async function courtsApi(tid: string, method: string, body?: object): Promise<Response> {
  const token = await getToken()
  return fetch(`/api/tournaments/${tid}/courts`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

// ─── Queries (qua API route → Admin SDK) ─────────────────────────────────────

export async function fetchCourtPageData(
  tid: string,
): Promise<{ courts: CourtWithState[]; referees: RefereeOption[] }> {
  const res = await courtsApi(tid, 'GET')
  if (!res.ok) return { courts: [], referees: [] }
  return (await res.json()) as { courts: CourtWithState[]; referees: RefereeOption[] }
}

// ─── Mutations (qua API route → Admin SDK) ────────────────────────────────────

export async function addCourt(tid: string, name: string, order: number): Promise<string> {
  const res = await courtsApi(tid, 'POST', { name, order })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Không thể tạo sân')
  }
  const data = (await res.json()) as { id: string }
  return data.id
}

export async function assignReferee(
  tid: string,
  courtId: string,
  uid: string | null,
): Promise<void> {
  const res = await courtsApi(tid, 'PATCH', { courtId, currentRefereeUid: uid })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Không thể gán trọng tài')
  }
}

export async function startMatch(tid: string, courtId: string): Promise<void> {
  const res = await courtsApi(tid, 'PATCH', {
    courtId,
    status: 'in_use',
    match: { gameLabel: 'Game 1', scoreA: 0, scoreB: 0 },
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Không thể bắt đầu trận')
  }
}
