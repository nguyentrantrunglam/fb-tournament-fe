import { TournamentInfoClient } from './_components/TournamentInfoClient'
import type { Tournament } from '@/lib/types/tournament'

// Placeholder — thay bằng fetch Firestore Admin SDK + categories query khi Phase 3 xong
async function getTournamentData(id: string): Promise<{
  tournament: Tournament
  categoryCodes: string[]
}> {
  return {
    tournament: {
      id,
      name: 'Giải Cầu Lông Mở Rộng Sài Gòn 2026',
      slug: 'sai-gon-mo-rong-2026',
      description:
        'Giải phong trào mở rộng cho cộng đồng cầu lông TP.HCM. 5 hạng mục đơn / đôi, mở đăng ký cho mọi CLB và VĐV độc lập.',
      startDate: '2026-05-28',
      endDate: '2026-05-30',
      location: 'Nhà thi đấu Phú Thọ, 219 Lý Thường Kiệt, Q.Phú Nhuận, TP.HCM',
      bannerUrl: null,
      rulesText: null,
      sponsors: [],
      paymentInfo: null,
      isPublic: true,
      ownerUid: 'uid-placeholder',
      status: 'running',
      createdAt: '2026-05-01T00:00:00Z',
    },
    categoryCodes: ['MS', 'WS', '+3'],
  }
}

export default async function TournamentInfoPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  const { tournament, categoryCodes } = await getTournamentData(tournamentId)

  return (
    <TournamentInfoClient tournament={tournament} categories={categoryCodes} />
  )
}
