import { ScheduleClient } from './_components/ScheduleClient'
import type { ScheduleMatch, CategoryScheduleConfig } from '@/lib/types/schedule'

const COURT_COUNT = 3

// Placeholder — thay bằng Firestore query categories + matches có scheduledAt
const MOCK_CONFIGS: CategoryScheduleConfig[] = [
  { id: 'cat-ms', code: 'MS', name: 'Đơn nam', matchCount: 15, startAt: '2026-05-28T08:00', estimatedMinPerMatch: 30 },
  { id: 'cat-ws', code: 'WS', name: 'Đơn nữ', matchCount: 7, startAt: '2026-05-28T13:00', estimatedMinPerMatch: 30 },
  { id: 'cat-md', code: 'MD', name: 'Đôi nam', matchCount: 11, startAt: '2026-05-29T08:00', estimatedMinPerMatch: 35 },
  { id: 'cat-mx', code: 'MX', name: 'Đôi nam-nữ', matchCount: 7, startAt: '2026-05-29T13:30', estimatedMinPerMatch: 35 },
]

const MOCK_MATCHES: ScheduleMatch[] = [
  { id: 'm1', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M01', sideAName: 'Nguyễn Văn Anh', sideBName: 'Phạm Minh Tuấn', scheduledAt: '2026-05-28T08:00', status: 'completed' },
  { id: 'm2', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M03', sideAName: 'Lê Hoàng Hùng', sideBName: 'Vũ Đình Dương', scheduledAt: '2026-05-28T08:00', status: 'in_progress' },
  { id: 'm3', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M04', sideAName: 'Hoàng Minh Đức', sideBName: 'Bùi Thế Thắng', scheduledAt: '2026-05-28T08:00', status: 'completed' },
  { id: 'm4', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M05', sideAName: 'Đặng Ngọc Nam', sideBName: 'Ngô Khắc Khoa', scheduledAt: '2026-05-28T08:30', status: 'in_progress' },
  { id: 'm5', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M07', sideAName: 'Phan Minh Bảo', sideBName: 'Cao Khắc Lâm', scheduledAt: '2026-05-28T08:30', status: 'pending' },
  { id: 'm6', categoryCode: 'MS', roundLabel: 'R1', matchNo: 'M08', sideAName: 'Lý Văn Quân', sideBName: 'Mai Tấn Phú', scheduledAt: '2026-05-28T08:30', status: 'walkover' },
  { id: 'm7', categoryCode: 'MS', roundLabel: 'QF', matchNo: 'M01', sideAName: 'Nguyễn Văn Anh', sideBName: 'Trần Quang Khang', scheduledAt: '2026-05-28T09:00', status: 'pending' },
  { id: 'm8', categoryCode: 'WS', roundLabel: 'RR', matchNo: 'M01', sideAName: 'Phạm Thị Mai', sideBName: 'Hoàng Thị Linh', scheduledAt: '2026-05-28T13:00', status: 'pending' },
  { id: 'm9', categoryCode: 'WS', roundLabel: 'RR', matchNo: 'M02', sideAName: 'Nguyễn Thị Lan', sideBName: 'Bùi Thị Vy', scheduledAt: '2026-05-28T13:00', status: 'pending' },
  { id: 'm10', categoryCode: 'MD', roundLabel: 'SF', matchNo: 'M01', sideAName: 'Đặng Văn Sơn / Lê Minh Tú', sideBName: 'Lý Văn Quân / Phan Minh Bảo', scheduledAt: '2026-05-29T08:00', status: 'pending' },
  { id: 'm11', categoryCode: 'MD', roundLabel: 'SF', matchNo: 'M02', sideAName: 'Hoàng Ngọc Nam / Bùi Tiến Đạt', sideBName: 'Phan Đăng Khoa / Tạ Quang Huy', scheduledAt: '2026-05-29T08:00', status: 'pending' },
  { id: 'm12', categoryCode: 'MX', roundLabel: 'QF', matchNo: 'M01', sideAName: 'Đặng Văn Sơn / Lê Thị Mai', sideBName: 'Trần Gia Long / Phạm Thị Hà', scheduledAt: '2026-05-29T13:30', status: 'pending' },
]

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  await params
  return <ScheduleClient configs={MOCK_CONFIGS} matches={MOCK_MATCHES} courtCount={COURT_COUNT} />
}
