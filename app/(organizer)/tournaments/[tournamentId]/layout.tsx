import { TournamentSidebar } from './_components/TournamentSidebar'
import { TournamentHeader } from './_components/TournamentHeader'
import type { Tournament } from '@/lib/types/tournament'

// Placeholder — thay bằng fetch Firestore Admin SDK khi Phase 2 xong
async function getTournament(id: string): Promise<Tournament> {
  return {
    id,
    name: 'Sài Gòn Mở Rộng 2026',
    slug: 'sai-gon-mo-rong-2026',
    description: 'Giải phong trào mở rộng cho cộng đồng cầu lông TP.HCM. 5 hạng mục đơn / đôi, mở đăng ký cho mọi CLB và VĐV độc lập.',
    startDate: '2026-05-28',
    endDate: '2026-05-30',
    location: 'Nhà thi đấu Phú Thọ, 219 Lý Thường Kiệt, Q.Phú Nhuận, TP.HCM',
    bannerUrl: null,
    rulesText: null,
    sponsors: [],
    paymentConfig: null,
    isPublic: true,
    ownerUid: 'uid-placeholder',
    status: 'running',
    createdAt: '2026-05-01T00:00:00Z',
  }
}

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  const tournament = await getTournament(tournamentId)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      <TournamentSidebar tournamentId={tournamentId} tournament={tournament} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TournamentHeader tournamentId={tournamentId} tournament={tournament} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
