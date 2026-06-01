import { CourtBoard } from './_components/CourtBoard'
import type { CourtWithState, RefereeOption } from '@/lib/types/court'

// Placeholder — thay bằng Firestore query (courts + roles where role==referee) khi backend xong
const MOCK_REFEREES: RefereeOption[] = [
  { uid: 'ref-dvs', name: 'Đặng V. Sơn', tag: 'ĐS' },
  { uid: 'ref-ntt', name: 'Nguyễn T. Thảo', tag: 'NT' },
  { uid: 'ref-pvd', name: 'Phan V. Đức', tag: 'PĐ' },
  { uid: 'ref-tmt', name: 'Trần M. Tuấn', tag: 'TT' },
]

const MOCK_COURTS: CourtWithState[] = [
  {
    id: 'court-1',
    tournamentId: 'demo',
    name: 'Sân 1',
    order: 1,
    status: 'in_use',
    currentRefereeUid: 'ref-dvs',
    match: {
      matchId: 'm07',
      categoryCode: 'MS',
      roundLabel: 'R1',
      matchNo: 'M07',
      sideAName: 'Phan M. Bảo',
      sideBName: 'Cao K. Lâm',
      gameLabel: 'Game 3',
      scoreA: 8,
      scoreB: 11,
    },
  },
  {
    id: 'court-2',
    tournamentId: 'demo',
    name: 'Sân 2',
    order: 2,
    status: 'in_use',
    currentRefereeUid: 'ref-dvs', // trùng Sân 1 → cảnh báo
    match: {
      matchId: 'm03',
      categoryCode: 'MS',
      roundLabel: 'R1',
      matchNo: 'M03',
      sideAName: 'Lê H. Hùng',
      sideBName: 'Vũ Đ. Dương',
      gameLabel: 'Game 2',
      scoreA: 14,
      scoreB: 17,
    },
  },
  {
    id: 'court-3',
    tournamentId: 'demo',
    name: 'Sân 3',
    order: 3,
    status: 'preparing',
    currentRefereeUid: 'ref-ntt',
    match: {
      matchId: 'm08',
      categoryCode: 'MS',
      roundLabel: 'R1',
      matchNo: 'M08',
      sideAName: 'Lý V. Quân',
      sideBName: 'Mai T. Phú',
      gameLabel: null,
      scoreA: null,
      scoreB: null,
    },
  },
]

export default async function CourtsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  const courts = MOCK_COURTS.map((c) => ({ ...c, tournamentId }))

  return (
    <CourtBoard
      courts={courts}
      referees={MOCK_REFEREES}
      tournamentId={tournamentId}
    />
  )
}
