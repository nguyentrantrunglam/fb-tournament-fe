import { getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'
import type { CourtWithState, CourtMatchPreview, CourtStatus, RefereeOption } from '@/lib/types/court'

function mapCourtDoc(id: string, tid: string, d: Record<string, unknown>): CourtWithState {
  const raw = d['match'] as Record<string, unknown> | null | undefined
  const match: CourtMatchPreview | null = raw
    ? {
        matchId: (raw['matchId'] as string) ?? '',
        categoryCode: (raw['categoryCode'] as string) ?? '',
        roundLabel: (raw['roundLabel'] as string) ?? '',
        matchNo: (raw['matchNo'] as string) ?? '',
        sideAName: (raw['sideAName'] as string) ?? '',
        sideBName: (raw['sideBName'] as string) ?? '',
        gameLabel: (raw['gameLabel'] as string | null) ?? null,
        scoreA: (raw['scoreA'] as number | null) ?? null,
        scoreB: (raw['scoreB'] as number | null) ?? null,
      }
    : null
  return {
    id,
    tournamentId: tid,
    name: (d['name'] as string) ?? '',
    order: (d['order'] as number) ?? 0,
    status: ((d['status'] as CourtStatus | undefined) ?? 'idle'),
    currentRefereeUid: (d['currentRefereeUid'] as string | null) ?? null,
    match,
  }
}

function buildTag(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase()
  }
  return displayName.substring(0, 2).toUpperCase()
}

export async function fetchCourts(tid: string): Promise<CourtWithState[]> {
  const db = getFirestore(getAdminApp())
  const snap = await db.collection(`tournaments/${tid}/courts`).orderBy('order').get()
  return snap.docs.map((d) => mapCourtDoc(d.id, tid, d.data() as Record<string, unknown>))
}

export async function fetchRefereeOptions(tid: string): Promise<RefereeOption[]> {
  const db = getFirestore(getAdminApp())
  const rolesSnap = await db
    .collection(`tournaments/${tid}/roles`)
    .where('role', '==', 'referee')
    .get()

  if (rolesSnap.empty) return []

  const uids = rolesSnap.docs.map((d) => d.id)
  const userSnaps = await Promise.all(uids.map((uid) => db.doc(`users/${uid}`).get()))

  return userSnaps
    .filter((u) => u.exists)
    .map((u) => {
      const data = u.data() as Record<string, unknown>
      const name = (data['displayName'] as string | undefined) ?? ''
      return { uid: u.id, name, tag: buildTag(name) }
    })
}
