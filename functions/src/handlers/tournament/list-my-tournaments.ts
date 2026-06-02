import { onCall } from 'firebase-functions/v2/https'
import { db, REGION } from '../../lib/admin'
import { assertOrganizer, isAdmin } from '../../middleware/role-guard'

type TournamentDoc = {
  name?: string
  slug?: string
  status?: string
  startDate?: string
  endDate?: string
  location?: string
  bannerUrl?: string | null
  logoUrl?: string | null
  ownerUid?: string
  createdAt?: { toMillis?: () => number }
}

// Giải của tôi: organizer thấy giải mình sở hữu; admin thấy tất cả.
export const listMyTournaments = onCall({ region: REGION }, async (req) => {
  const uid = assertOrganizer(req)

  const col = db.collection('tournaments')
  const snap = isAdmin(req) ? await col.get() : await col.where('ownerUid', '==', uid).get()

  const tournaments = snap.docs.map((d) => {
    const t = d.data() as TournamentDoc
    return {
      id: d.id,
      name: t.name ?? '',
      slug: t.slug ?? '',
      status: t.status ?? 'draft',
      startDate: t.startDate ?? null,
      endDate: t.endDate ?? null,
      location: t.location ?? '',
      bannerUrl: t.bannerUrl ?? null,
      logoUrl: t.logoUrl ?? null,
      isOwner: t.ownerUid === uid,
      createdAt: t.createdAt?.toMillis?.() ?? null,
    }
  })

  tournaments.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  return { tournaments }
})
