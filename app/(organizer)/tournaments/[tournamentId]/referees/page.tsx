import { RefereeList } from './_components/RefereeList'
import type { RefereeWithStats } from '@/lib/types/referee'

// Placeholder — thay bằng Firestore query khi Phase 3 xong
const MOCK_REFEREES: RefereeWithStats[] = [
  {
    uid: 'ref-dvs',
    tournamentId: 'demo',
    displayName: 'Đặng Văn Sơn',
    phone: '0983 123 456',
    avatarUrl: null,
    status: 'online',
    assignedCourts: ['Sân 1', 'Sân 2'],
    matchesTodayCount: 5,
    lastSeenLabel: null,
  },
  {
    uid: 'ref-ntt',
    tournamentId: 'demo',
    displayName: 'Nguyễn Thị Thảo',
    phone: '0987 654 321',
    avatarUrl: null,
    status: 'online',
    assignedCourts: ['Sân 3'],
    matchesTodayCount: 4,
    lastSeenLabel: null,
  },
  {
    uid: 'ref-pvd',
    tournamentId: 'demo',
    displayName: 'Phan Văn Đức',
    phone: '0912 345 678',
    avatarUrl: null,
    status: 'available',
    assignedCourts: [],
    matchesTodayCount: 3,
    lastSeenLabel: null,
  },
  {
    uid: 'ref-tmt',
    tournamentId: 'demo',
    displayName: 'Trần Minh Tuấn',
    phone: '0988 765 432',
    avatarUrl: null,
    status: 'offline',
    assignedCourts: [],
    matchesTodayCount: 0,
    lastSeenLabel: 'hôm qua 18:42',
  },
]

export default async function RefereesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  const referees = MOCK_REFEREES.map((r) => ({ ...r, tournamentId }))

  return <RefereeList referees={referees} tournamentId={tournamentId} />
}
