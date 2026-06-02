import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, REGION } from '../../lib/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { assertOrganizer } from '../../middleware/role-guard'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

type Payload = { name?: unknown; startDate?: unknown; endDate?: unknown; location?: unknown }

// Tạo giải: organizer/admin. Set ownerUid + roles/{uid}=organizer. Trả {id}.
export const createTournament = onCall({ region: REGION }, async (req) => {
  const uid = assertOrganizer(req)
  const { name, startDate, endDate, location } = (req.data ?? {}) as Payload

  if (typeof name !== 'string' || name.trim().length < 3)
    throw new HttpsError('invalid-argument', 'Tên giải tối thiểu 3 ký tự')
  if (typeof startDate !== 'string' || !startDate) throw new HttpsError('invalid-argument', 'Thiếu ngày bắt đầu')
  if (typeof endDate !== 'string' || !endDate) throw new HttpsError('invalid-argument', 'Thiếu ngày kết thúc')
  if (endDate < startDate) throw new HttpsError('invalid-argument', 'Ngày kết thúc phải sau ngày bắt đầu')
  if (typeof location !== 'string' || location.trim().length < 3)
    throw new HttpsError('invalid-argument', 'Thiếu địa điểm')

  const ref = db.collection('tournaments').doc()
  const slug = `${slugify(name) || 'giai'}-${ref.id.slice(0, 5).toLowerCase()}`
  const now = FieldValue.serverTimestamp()

  const batch = db.batch()
  batch.set(ref, {
    name: name.trim(),
    slug,
    description: '',
    startDate,
    endDate,
    location: location.trim(),
    bannerUrl: null,
    logoUrl: null,
    rulesText: null,
    sponsors: [],
    paymentConfig: null,
    isPublic: false,
    ownerUid: uid,
    status: 'draft',
    createdAt: now,
  })
  batch.set(ref.collection('roles').doc(uid), { role: 'organizer', createdAt: now })
  await batch.commit()

  return { id: ref.id, slug }
})
