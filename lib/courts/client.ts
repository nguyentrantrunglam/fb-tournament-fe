import { api } from '@/lib/api/client'
import type { CourtWithState, RefereeOption } from '@/lib/types/court'

// API court shape uses currentRefereeUserId (was currentRefereeUid in Firebase)
type ApiCourt = {
  id: string
  tournamentId: string
  name: string
  status: string
  currentRefereeUserId: string | null
  currentMatchId: string | null
}

function mapCourt(c: ApiCourt): CourtWithState {
  return {
    id: c.id,
    tournamentId: c.tournamentId,
    name: c.name,
    order: 0, // API doesn't return order field yet; placeholder for UI sort
    status: (c.status as CourtWithState['status']) ?? 'idle',
    currentRefereeUid: c.currentRefereeUserId,
    match: null, // match preview populated by operations module (Phase 5+)
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchCourtPageData(
  tid: string,
): Promise<{ courts: CourtWithState[]; referees: RefereeOption[] }> {
  try {
    const res = await api.get<{ courts: ApiCourt[] }>(`/tournaments/${tid}/courts`)
    const courts = (res.courts ?? []).map(mapCourt)

    // Referee list for the picker comes from the referees endpoint
    const refRes = await api.get<{ referees: Array<{ userId: string; displayName: string; avatarUrl: string | null }> }>(
      `/tournaments/${tid}/referees`,
    )
    const referees: RefereeOption[] = (refRes.referees ?? []).map((r) => ({
      uid: r.userId,
      name: r.displayName,
      tag: buildTag(r.displayName),
    }))

    return { courts, referees }
  } catch {
    return { courts: [], referees: [] }
  }
}

function buildTag(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addCourt(tid: string, name: string, _order: number): Promise<string> {
  const res = await api.post<{ id: string }>(`/tournaments/${tid}/courts`, { name })
  return res.id
}

// Court referee-assignment + start-match belong to the operations console, which
// isn't built on the new api yet. Fail VISIBLY so the UI doesn't pretend it worked.
const OPS_NOT_AVAILABLE = 'Vận hành sân (gán trọng tài / bắt đầu trận) đang được hoàn thiện.'

export async function assignReferee(
  _tid: string,
  _courtId: string,
  _uid: string | null,
): Promise<void> {
  throw new Error(OPS_NOT_AVAILABLE)
}

export async function startMatch(_tid: string, _courtId: string): Promise<void> {
  throw new Error(OPS_NOT_AVAILABLE)
}
