import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params

  const bearer = req.headers.get('authorization') ?? ''
  if (!bearer.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let callerUid: string
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(bearer.slice(7))
    callerUid = decoded.uid
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = getFirestore(getAdminApp())
  const tourSnap = await db.doc(`tournaments/${tournamentId}`).get()
  if (!tourSnap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const tourData = tourSnap.data()!
  const isOwner = callerUid === (tourData['ownerUid'] as string)
  const isPublic = (tourData['isPublic'] as boolean) === true
  if (!isOwner && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [rolesSnap, courtsSnap] = await Promise.all([
    db.collection(`tournaments/${tournamentId}/roles`).where('role', '==', 'referee').get(),
    db.collection(`tournaments/${tournamentId}/courts`).get(),
  ])

  if (rolesSnap.empty) return NextResponse.json({ referees: [] })

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

  const referees: RefereeWithStats[] = rolesSnap.docs.map((roleDoc) => {
    const uid = roleDoc.id
    const roleData = roleDoc.data()
    const user = userByUid[uid] ?? {}
    const assignedCourts = courtsByReferee[uid] ?? []
    const isOnline = (user['isOnline'] as boolean | undefined) ?? false
    const lastSeen = (user['lastSeen'] as Timestamp | null | undefined) ?? null

    const status: RefereeStatus = isOnline
      ? assignedCourts.length > 0 ? 'online' : 'available'
      : 'offline'

    return {
      uid,
      tournamentId,
      displayName: (roleData['displayName'] as string | undefined) ?? (user['displayName'] as string | undefined) ?? '',
      phone: (roleData['phone'] as string | undefined) ?? '',
      avatarUrl: (user['avatarUrl'] as string | null | undefined) ?? null,
      status,
      assignedCourts,
      matchesTodayCount: 0,
      lastSeenLabel: status === 'offline' && lastSeen ? formatLastSeen(lastSeen) : null,
    }
  })

  return NextResponse.json({ referees })
}

// Batch invite: thêm nhiều trọng tài cùng lúc
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params

  const bearer = req.headers.get('authorization') ?? ''
  if (!bearer.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let callerUid: string
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(bearer.slice(7))
    callerUid = decoded.uid
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const db = getFirestore(getAdminApp())
  const tourSnap = await db.doc(`tournaments/${tournamentId}`).get()
  if (!tourSnap.exists || tourSnap.data()?.['ownerUid'] !== callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as { uids?: string[] }
  const uids = body.uids ?? []
  if (uids.length === 0) return NextResponse.json({ error: 'Danh sách uid rỗng' }, { status: 400 })

  const auth = getAuth(getAdminApp())
  const batch = db.batch()

  await Promise.all(
    uids.map(async (uid) => {
      const record = await auth.getUser(uid)
      batch.set(
        db.doc(`tournaments/${tournamentId}/roles/${uid}`),
        {
          role: 'referee',
          grantedBy: callerUid,
          grantedAt: FieldValue.serverTimestamp(),
          displayName: record.displayName ?? '',
          phone: record.phoneNumber ?? '',
        },
        { merge: true },
      )
    }),
  )

  await batch.commit()
  return NextResponse.json({ ok: true, count: uids.length })
}
