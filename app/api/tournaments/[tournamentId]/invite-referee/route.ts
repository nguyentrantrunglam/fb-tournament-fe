import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'

// Chuyển "0912345678" → "+84912345678" để lookup Firebase Auth
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return `+84${digits.slice(1)}`
  if (digits.startsWith('84') && digits.length === 11) return `+${digits}`
  return phone
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params

  // 1. Xác minh token caller
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

  // 2. Chỉ owner giải mới được mời
  const db = getFirestore(getAdminApp())
  const tourSnap = await db.doc(`tournaments/${tournamentId}`).get()
  if (!tourSnap.exists || tourSnap.data()?.['ownerUid'] !== callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Tìm uid qua email hoặc SĐT
  const body = await req.json() as { emailOrPhone?: string }
  const raw = (body.emailOrPhone ?? '').trim()
  if (!raw) {
    return NextResponse.json({ error: 'Thiếu email hoặc số điện thoại' }, { status: 400 })
  }

  let targetUid: string
  try {
    const auth = getAuth(getAdminApp())
    if (raw.includes('@')) {
      targetUid = (await auth.getUserByEmail(raw)).uid
    } else {
      targetUid = (await auth.getUserByPhoneNumber(toE164(raw))).uid
    }
  } catch {
    return NextResponse.json(
      { error: 'Không tìm thấy tài khoản với email/SĐT này' },
      { status: 404 },
    )
  }

  // 4. Gán role referee, lưu thêm displayName + phone để client đọc được
  const userRecord = await getAuth(getAdminApp()).getUser(targetUid)
  await db.doc(`tournaments/${tournamentId}/roles/${targetUid}`).set(
    {
      role: 'referee',
      grantedBy: callerUid,
      grantedAt: FieldValue.serverTimestamp(),
      displayName: userRecord.displayName ?? '',
      phone: userRecord.phoneNumber ?? '',
    },
    { merge: true },
  )

  return NextResponse.json({ uid: targetUid })
}
