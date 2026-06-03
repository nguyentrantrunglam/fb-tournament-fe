import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'

export type SearchUserResult = {
  uid: string
  displayName: string
  email: string
  phone: string
  avatarUrl: string | null
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return `+84${digits.slice(1)}`
  if (digits.startsWith('84') && digits.length === 11) return `+${digits}`
  return phone
}

const HIGH = ''

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ users: [] })

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

  // UID đã được mời → loại khỏi kết quả
  const rolesSnap = await db
    .collection(`tournaments/${tournamentId}/roles`)
    .where('role', '==', 'referee')
    .get()
  const existingUids = new Set(rolesSnap.docs.map((d) => d.id))

  const auth = getAuth(getAdminApp())

  // Kết quả, dùng Map để dedup theo uid
  const byUid = new Map<string, SearchUserResult>()

  function addFromDoc(uid: string, data: Record<string, unknown>) {
    if (existingUids.has(uid) || byUid.has(uid)) return
    byUid.set(uid, {
      uid,
      displayName: (data['displayName'] as string) ?? '',
      email: (data['email'] as string) ?? '',
      phone: (data['phone'] as string) ?? '',
      avatarUrl: (data['avatarUrl'] as string | null) ?? null,
    })
  }

  const isPhone = /^\+?[\d\s()-]{7,}$/.test(q) && !q.includes('@')

  if (isPhone) {
    // Tìm chính xác theo SĐT qua Firebase Auth
    try {
      const record = await auth.getUserByPhoneNumber(toE164(q))
      if (!existingUids.has(record.uid)) {
        const userDoc = await db.doc(`users/${record.uid}`).get()
        const data = userDoc.data() ?? {}
        byUid.set(record.uid, {
          uid: record.uid,
          displayName: record.displayName ?? (data['displayName'] as string) ?? '',
          email: record.email ?? (data['email'] as string) ?? '',
          phone: record.phoneNumber ?? '',
          avatarUrl: (data['avatarUrl'] as string | null) ?? null,
        })
      }
    } catch { /* không tìm thấy */ }
  } else {
    // Chạy song song: prefix displayName + prefix email + exact email Auth
    const queries: Promise<void>[] = []

    // 1. Prefix search theo displayName
    queries.push(
      db.collection('users')
        .where('displayName', '>=', q)
        .where('displayName', '<=', q + HIGH)
        .limit(10)
        .get()
        .then((snap) => snap.docs.forEach((d) => addFromDoc(d.id, d.data() as Record<string, unknown>)))
        .catch(() => {}),
    )

    // 2. Prefix search theo email (nếu field email được lưu trong users collection)
    queries.push(
      db.collection('users')
        .where('email', '>=', q)
        .where('email', '<=', q + HIGH)
        .limit(10)
        .get()
        .then((snap) => snap.docs.forEach((d) => addFromDoc(d.id, d.data() as Record<string, unknown>)))
        .catch(() => {}),
    )

    // 3. Nếu q trông giống email đầy đủ → thử exact lookup qua Firebase Auth
    if (q.includes('@') && q.indexOf('@') < q.length - 1) {
      queries.push(
        auth.getUserByEmail(q)
          .then(async (record) => {
            if (existingUids.has(record.uid) || byUid.has(record.uid)) return
            const userDoc = await db.doc(`users/${record.uid}`).get()
            const data = userDoc.data() ?? {}
            byUid.set(record.uid, {
              uid: record.uid,
              displayName: record.displayName ?? (data['displayName'] as string) ?? '',
              email: record.email ?? '',
              phone: record.phoneNumber ?? (data['phone'] as string) ?? '',
              avatarUrl: (data['avatarUrl'] as string | null) ?? null,
            })
          })
          .catch(() => {}),
      )
    }

    await Promise.all(queries)
  }

  return NextResponse.json({ users: [...byUid.values()].slice(0, 15) })
}
