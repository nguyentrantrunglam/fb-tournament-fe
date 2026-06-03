import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase/admin'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryFeeItem, CategoryRegistrationStatus } from '@/lib/types/category'

async function verifyOwner(req: NextRequest, tournamentId: string) {
  const bearer = req.headers.get('authorization') ?? ''
  if (!bearer.startsWith('Bearer ')) return null
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(bearer.slice(7))
    const db = getFirestore(getAdminApp())
    const snap = await db.doc(`tournaments/${tournamentId}`).get()
    if (!snap.exists) return null
    if (snap.data()!['ownerUid'] !== decoded.uid) return null
    return decoded.uid
  } catch {
    return null
  }
}

// ─── GET: lấy paymentConfig + category fee items ──────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params
  const uid = await verifyOwner(req, tournamentId)
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = getFirestore(getAdminApp())
  const [tourSnap, catSnap] = await Promise.all([
    db.doc(`tournaments/${tournamentId}`).get(),
    db.collection(`tournaments/${tournamentId}/categories`).get(),
  ])

  const tourData = tourSnap.data() ?? {}
  const paymentConfig = (tourData['paymentConfig'] as PaymentConfig | null) ?? null

  const categories: CategoryFeeItem[] = catSnap.docs.map((d) => {
    const c = d.data()
    return {
      id: d.id,
      code: (c['code'] as string) ?? '',
      name: (c['name'] as string) ?? '',
      playerCount: ((c['playerCount'] as 1 | 2) ?? 1),
      genderRequirement: (c['genderRequirement'] as CategoryFeeItem['genderRequirement']) ?? 'unrestricted',
      fee: (c['fee'] as number) ?? 0,
      registrationStatus: (c['registrationStatus'] as CategoryRegistrationStatus) ?? 'not_open',
    }
  })

  return NextResponse.json({ paymentConfig, categories })
}

// ─── PUT: lưu paymentConfig + batch cập nhật lệ phí hạng mục ─────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params
  const uid = await verifyOwner(req, tournamentId)
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    paymentConfig: PaymentConfig
    categoryFees: { id: string; fee: number }[]
  }

  const db = getFirestore(getAdminApp())
  const batch = db.batch()

  batch.update(db.doc(`tournaments/${tournamentId}`), {
    paymentConfig: body.paymentConfig,
    updatedAt: FieldValue.serverTimestamp(),
  })

  for (const { id, fee } of (body.categoryFees ?? [])) {
    batch.update(db.doc(`tournaments/${tournamentId}/categories/${id}`), { fee })
  }

  await batch.commit()
  return NextResponse.json({ ok: true })
}

// ─── PATCH: toggle cổng đăng ký hạng mục (tức thì, không gộp vào Save) ───────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params
  const uid = await verifyOwner(req, tournamentId)
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    categoryId: string
    registrationStatus: CategoryRegistrationStatus
  }
  if (!body.categoryId) return NextResponse.json({ error: 'Thiếu categoryId' }, { status: 400 })

  const db = getFirestore(getAdminApp())
  await db.doc(`tournaments/${tournamentId}/categories/${body.categoryId}`).update({
    registrationStatus: body.registrationStatus,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
