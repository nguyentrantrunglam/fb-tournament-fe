import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'
import type { CourtWithState, CourtMatchPreview, CourtStatus } from '@/lib/types/court'
import type { RefereeOption } from '@/lib/types/court'

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

function buildTag(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

async function verifyOwner(req: NextRequest, tournamentId: string) {
  const bearer = req.headers.get('authorization') ?? ''
  if (!bearer.startsWith('Bearer ')) return null
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(bearer.slice(7))
    const db = getFirestore(getAdminApp())
    const tourSnap = await db.doc(`tournaments/${tournamentId}`).get()
    if (!tourSnap.exists) return null
    const data = tourSnap.data()!
    if (decoded.uid !== (data['ownerUid'] as string)) return null
    return { uid: decoded.uid, isPublic: (data['isPublic'] as boolean) === true }
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params
  const auth = await verifyOwner(req, tournamentId)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = getFirestore(getAdminApp())
  const [courtsSnap, rolesSnap] = await Promise.all([
    db.collection(`tournaments/${tournamentId}/courts`).orderBy('order').get(),
    db.collection(`tournaments/${tournamentId}/roles`).where('role', '==', 'referee').get(),
  ])

  const courts: CourtWithState[] = courtsSnap.docs.map((d) =>
    mapCourtDoc(d.id, tournamentId, d.data() as Record<string, unknown>),
  )

  const uids = rolesSnap.docs.map((d) => d.id)
  const userSnaps = await Promise.all(uids.map((uid) => db.doc(`users/${uid}`).get()))
  const referees: RefereeOption[] = userSnaps
    .filter((u) => u.exists)
    .map((u) => {
      const roleDoc = rolesSnap.docs.find((d) => d.id === u.id)
      const name =
        (roleDoc?.data()['displayName'] as string | undefined) ??
        (u.data()!['displayName'] as string | undefined) ??
        ''
      return { uid: u.id, name, tag: buildTag(name) }
    })

  return NextResponse.json({ courts, referees })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params

  // 1. Xác minh token
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

  // 2. Chỉ owner giải mới được thêm sân
  const db = getFirestore(getAdminApp())
  const tourSnap = await db.doc(`tournaments/${tournamentId}`).get()
  if (!tourSnap.exists || tourSnap.data()?.['ownerUid'] !== callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Tạo sân
  const body = await req.json() as { name?: string; order?: number }
  const name = (body.name ?? '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Thiếu tên sân' }, { status: 400 })
  }

  const ref = await db.collection(`tournaments/${tournamentId}/courts`).add({
    name,
    order: body.order ?? 1,
    status: 'idle',
    currentRefereeUid: null,
    match: null,
    createdAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ id: ref.id })
}

export async function PATCH(
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
  if (!tourSnap.exists || tourSnap.data()?.['ownerUid'] !== callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as { courtId?: string; currentRefereeUid?: string | null; status?: string; match?: Record<string, unknown> }
  const { courtId, ...patch } = body
  if (!courtId) {
    return NextResponse.json({ error: 'Thiếu courtId' }, { status: 400 })
  }

  await db.doc(`tournaments/${tournamentId}/courts/${courtId}`).update(patch)
  return NextResponse.json({ ok: true })
}
