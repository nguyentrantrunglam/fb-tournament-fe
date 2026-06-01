import { CategoryList } from './_components/CategoryList'
import type { CategoryWithStats } from '@/lib/types/category'

// Placeholder data — thay bằng Firestore query khi Phase 3 xong
const MOCK_CATEGORIES: CategoryWithStats[] = [
  {
    id: 'cat-ms',
    tournamentId: 'demo',
    code: 'MS',
    name: 'Đơn nam',
    playerCount: 1,
    genderRequirement: 'men_only',
    format: 'single_elim',
    bestOf: 3,
    fee: 100000,
    maxTeams: 16,
    registrationDeadline: '2026-05-25T23:59:00+07:00',
    registrationStatus: 'closed',
    slotFilled: 16,
    slotApproved: 16,
    slotPaid: 14,
    byeCount: 0,
    currentRound: 'R1',
  },
  {
    id: 'cat-ws',
    tournamentId: 'demo',
    code: 'WS',
    name: 'Đơn nữ',
    playerCount: 1,
    genderRequirement: 'women_only',
    format: 'single_elim',
    bestOf: 3,
    fee: 100000,
    maxTeams: 8,
    registrationDeadline: '2026-05-25T23:59:00+07:00',
    registrationStatus: 'closed',
    slotFilled: 8,
    slotApproved: 8,
    slotPaid: 7,
    byeCount: 0,
    currentRound: null,
  },
  {
    id: 'cat-md',
    tournamentId: 'demo',
    code: 'MD',
    name: 'Đôi nam',
    playerCount: 2,
    genderRequirement: 'men_only',
    format: 'single_elim',
    bestOf: 3,
    fee: 200000,
    maxTeams: 16,
    registrationDeadline: '2026-05-25T23:59:00+07:00',
    registrationStatus: 'closed',
    slotFilled: 12,
    slotApproved: 12,
    slotPaid: 8,
    byeCount: 2,
    currentRound: null,
  },
  {
    id: 'cat-wd',
    tournamentId: 'demo',
    code: 'WD',
    name: 'Đôi nữ',
    playerCount: 2,
    genderRequirement: 'women_only',
    format: 'single_elim',
    bestOf: 3,
    fee: 200000,
    maxTeams: 8,
    registrationDeadline: '2026-05-25T23:59:00+07:00',
    registrationStatus: 'closed',
    slotFilled: 8,
    slotApproved: 8,
    slotPaid: 8,
    byeCount: 0,
    currentRound: null,
  },
  {
    id: 'cat-mx',
    tournamentId: 'demo',
    code: 'MX',
    name: 'Đôi nam-nữ',
    playerCount: 2,
    genderRequirement: 'mixed_pair',
    format: 'single_elim',
    bestOf: 3,
    fee: 250000,
    maxTeams: 24,
    registrationDeadline: '2026-05-25T23:59:00+07:00',
    registrationStatus: 'closed',
    slotFilled: 21,
    slotApproved: 21,
    slotPaid: 14,
    byeCount: 3,
    currentRound: null,
  },
]

export default async function ContentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  const categories = MOCK_CATEGORIES.map((c) => ({ ...c, tournamentId }))

  // tournament.status = 'running' → bốc thăm xong → không tạo hạng mục mới được
  const canCreate = false

  return (
    <CategoryList
      categories={categories}
      tournamentId={tournamentId}
      canCreate={canCreate}
    />
  )
}
