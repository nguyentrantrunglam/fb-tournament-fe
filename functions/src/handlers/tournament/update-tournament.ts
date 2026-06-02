import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, REGION } from '../../lib/admin'
import { assertTournamentAccess } from '../../middleware/role-guard'

const TIERS = ['diamond', 'gold', 'silver', 'operator', 'media']

type SponsorIn = { id?: unknown; tier?: unknown; name?: unknown; logoUrl?: unknown; link?: unknown; description?: unknown }

// Cập nhật 1 phần thông tin giải (các tab). Owner/admin. Chỉ nhận field hợp lệ.
export const updateTournament = onCall({ region: REGION }, async (req) => {
  const d = (req.data ?? {}) as Record<string, unknown>
  const id = String(d['id'] ?? '')
  await assertTournamentAccess(req, id)

  const patch: Record<string, unknown> = {}

  if ('name' in d) {
    const name = String(d['name'] ?? '').trim()
    if (name.length < 3) throw new HttpsError('invalid-argument', 'Tên giải tối thiểu 3 ký tự')
    patch['name'] = name
  }
  if ('slug' in d) {
    const slug = String(d['slug'] ?? '').trim()
    if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new HttpsError('invalid-argument', 'Slug không hợp lệ')
    patch['slug'] = slug
  }
  if ('description' in d) patch['description'] = String(d['description'] ?? '').slice(0, 1000)
  if ('startDate' in d) patch['startDate'] = String(d['startDate'] ?? '')
  if ('endDate' in d) patch['endDate'] = String(d['endDate'] ?? '')
  if (patch['startDate'] && patch['endDate'] && (patch['endDate'] as string) < (patch['startDate'] as string))
    throw new HttpsError('invalid-argument', 'Ngày kết thúc phải sau ngày bắt đầu')
  if ('location' in d) patch['location'] = String(d['location'] ?? '').trim()
  if ('rulesText' in d) patch['rulesText'] = d['rulesText'] ? String(d['rulesText']).slice(0, 20000) : null
  if ('bannerUrl' in d) patch['bannerUrl'] = d['bannerUrl'] ? String(d['bannerUrl']) : null
  if ('logoUrl' in d) patch['logoUrl'] = d['logoUrl'] ? String(d['logoUrl']) : null
  if ('isPublic' in d) patch['isPublic'] = d['isPublic'] === true

  if ('sponsors' in d) {
    if (!Array.isArray(d['sponsors'])) throw new HttpsError('invalid-argument', 'sponsors phải là mảng')
    patch['sponsors'] = (d['sponsors'] as SponsorIn[]).map((s, i) => {
      const tier = String(s.tier ?? '')
      if (!TIERS.includes(tier)) throw new HttpsError('invalid-argument', 'Bậc tài trợ không hợp lệ')
      return {
        id: String(s.id ?? `s${i}`),
        tier,
        name: String(s.name ?? '').slice(0, 120),
        logoUrl: s.logoUrl ? String(s.logoUrl) : null,
        link: String(s.link ?? '').slice(0, 300),
        description: String(s.description ?? '').slice(0, 300),
      }
    })
  }

  if (Object.keys(patch).length === 0) return { ok: true }
  await db.doc(`tournaments/${id}`).set(patch, { merge: true })
  return { ok: true }
})
