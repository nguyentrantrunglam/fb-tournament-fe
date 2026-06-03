import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'
import type { RefereeWithStats, RefereeStatus } from '@/lib/types/referee'

function formatLastSeen(ts: Timestamp): string {
  const date = ts.toDate()
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const dayMs = 86_400_000
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  if (diffMs < dayMs) return `hôm nay ${hh}:${mm}`
  if (diffMs < 2 * dayMs) return `hôm qua ${hh}:${mm}`
  return `${Math.floor(diffMs / dayMs)} ngày trước`
}

export async function fetchRefereesWithStats(tid: string): Promise<RefereeWithStats[]> {
  const db = getFirestore(getAdminApp())

  const [rolesSnap, courtsSnap] = await Promise.all([
    db.collection(`tournaments/${tid}/roles`).where('role', '==', 'referee').get(),
    db.collection(`tournaments/${tid}/courts`).get(),
  ])

  if (rolesSnap.empty) return []

  // uid → tên sân đang được gán
  const courtsByReferee: Record<string, string[]> = {}
  for (const c of courtsSnap.docs) {
    const d = c.data()
    const uid = d['currentRefereeUid'] as string | null
    if (uid) {
      courtsByReferee[uid] ??= []
      courtsByReferee[uid].push(d['name'] as string)
    }
  }

  const uids = rolesSnap.docs.map((d) => d.id)
  const userSnaps = await Promise.all(uids.map((uid) => db.doc(`users/${uid}`).get()))
  const userByUid: Record<string, Record<string, unknown>> = {}
  for (const snap of userSnaps) {
    if (snap.exists) userByUid[snap.id] = snap.data() as Record<string, unknown>
  }

  return rolesSnap.docs.map((roleDoc) => {
    const uid = roleDoc.id
    const user = userByUid[uid] ?? {}
    const assignedCourts = courtsByReferee[uid] ?? []
    const isOnline = (user['isOnline'] as boolean | undefined) ?? false
    const lastSeen = (user['lastSeen'] as Timestamp | null | undefined) ?? null

    const status: RefereeStatus = isOnline
      ? assignedCourts.length > 0
        ? 'online'
        : 'available'
      : 'offline'

    return {
      uid,
      tournamentId: tid,
      displayName: (user['displayName'] as string | undefined) ?? '',
      phone: (user['phone'] as string | undefined) ?? '',
      avatarUrl: (user['avatarUrl'] as string | null | undefined) ?? null,
      status,
      assignedCourts,
      matchesTodayCount: 0, // TODO: phase N — count từ matches sub-collection
      lastSeenLabel: status === 'offline' && lastSeen ? formatLastSeen(lastSeen) : null,
    }
  })
}
