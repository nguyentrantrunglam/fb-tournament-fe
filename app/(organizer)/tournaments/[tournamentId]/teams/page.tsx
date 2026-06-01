import { TeamsClient } from './_components/TeamsClient'
import type { CategoryTeams, TeamEntry } from '@/lib/types/team'

// 8 cặp MX có chi tiết; phần còn lại generate để khớp approvedCount = 21
const MX_NAMED: TeamEntry[] = [
  { id: 'mx1', seed: 1, players: [{ name: 'Hùng', initials: 'LH' }, { name: 'Thảo', initials: 'NT' }], clubName: 'CLB Phú Nhuận', photoUploaded: false },
  { id: 'mx2', seed: 2, players: [{ name: 'Đức', initials: 'HM' }, { name: 'Lan', initials: 'VL' }], clubName: 'CLB Tân Bình', photoUploaded: false },
  { id: 'mx3', seed: 3, players: [{ name: 'Bảo', initials: 'PB' }, { name: 'Khánh', initials: 'DK' }], clubName: null, photoUploaded: true },
  { id: 'mx4', seed: 4, players: [{ name: 'Anh', initials: 'NA' }, { name: 'Hà', initials: 'VH' }], clubName: 'CLB Quận 7', photoUploaded: false },
  { id: 'mx5', seed: 5, players: [{ name: 'Linh', initials: 'TL' }, { name: 'Phương', initials: 'MP' }], clubName: null, photoUploaded: false },
  { id: 'mx6', seed: null, players: [{ name: 'Quang', initials: 'BQ' }, { name: 'My', initials: 'NM' }], clubName: 'CLB Thủ Đức', photoUploaded: false },
  { id: 'mx7', seed: null, players: [{ name: 'Cường', initials: 'CD' }, { name: 'Hằng', initials: 'HT' }], clubName: null, photoUploaded: false },
  { id: 'mx8', seed: null, players: [{ name: 'Tâm', initials: 'TT' }, { name: 'Yến', initials: 'YL' }], clubName: 'CLB Bình Thạnh', photoUploaded: false },
]

const MX_FILLER: TeamEntry[] = Array.from({ length: 13 }, (_, i) => ({
  id: `mx-f${i + 9}`,
  seed: null,
  players: [
    { name: `VĐV ${i * 2 + 1}`, initials: 'A' + (i + 1) },
    { name: `VĐV ${i * 2 + 2}`, initials: 'B' + (i + 1) },
  ],
  clubName: i % 2 === 0 ? null : `CLB ${i + 1}`,
  photoUploaded: false,
}))

const MOCK: CategoryTeams[] = [
  { id: 'cat-ms', code: 'MS', name: 'Đơn nam', playerCount: 1, approvedCount: 16, seededCount: 4, drawStatus: 'not_drawn', bracketVersion: null, teams: [] },
  { id: 'cat-ws', code: 'WS', name: 'Đơn nữ', playerCount: 1, approvedCount: 8, seededCount: 2, drawStatus: 'not_drawn', bracketVersion: null, teams: [] },
  { id: 'cat-md', code: 'MD', name: 'Đôi nam', playerCount: 2, approvedCount: 12, seededCount: 4, drawStatus: 'not_drawn', bracketVersion: null, teams: [] },
  { id: 'cat-wd', code: 'WD', name: 'Đôi nữ', playerCount: 2, approvedCount: 8, seededCount: 0, drawStatus: 'not_drawn', bracketVersion: null, teams: [] },
  { id: 'cat-mx', code: 'MX', name: 'Đôi nam-nữ', playerCount: 2, approvedCount: 21, seededCount: 5, drawStatus: 'drawn', bracketVersion: 1, teams: [...MX_NAMED, ...MX_FILLER] },
]

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  await params
  return <TeamsClient categories={MOCK} />
}
