import type {
  CategoryBracket,
  BracketMatch,
  MatchSide,
  KnockoutRound,
  StandingRow,
} from '@/lib/types/bracket'

// ─── Helpers dựng MatchSide ────────────────────────────────────────────────
function p(seed: number | null, name: string, score: number | null = null, isWinner = false): MatchSide {
  return { seed, name, placeholder: null, score, isWinner }
}
function ph(placeholder: string): MatchSide {
  return { seed: null, name: null, placeholder, score: null, isWinner: false }
}

// ─── MS · Single elimination (hero, theo mockup) ───────────────────────────
const MS_R1: BracketMatch[] = [
  { id: 'ms-r1m01', code: 'R1·M01', state: 'completed', liveCourt: null, sideA: p(1, 'Nguyễn Văn Anh', 21, true), sideB: p(16, 'Phạm Minh Tuấn', 15) },
  { id: 'ms-r1m02', code: 'R1·M02', state: 'bye', liveCourt: null, sideA: p(8, 'Trần Quang Khang'), sideB: null },
  { id: 'ms-r1m03', code: 'R1·M03', state: 'live', liveCourt: 'Sân 2', sideA: p(4, 'Lê Hoàng Hùng', 14), sideB: p(13, 'Vũ Đình Dương', 17) },
  { id: 'ms-r1m04', code: 'R1·M04', state: 'completed', liveCourt: null, sideA: p(5, 'Hoàng Minh Đức', 21, true), sideB: p(12, 'Bùi Thế Thắng', 19) },
  { id: 'ms-r1m05', code: 'R1·M05', state: 'completed', liveCourt: null, sideA: p(2, 'Đặng Ngọc Nam', 21, true), sideB: p(15, 'Ngô Khắc Khoa', 12) },
  { id: 'ms-r1m06', code: 'R1·M06', state: 'bye', liveCourt: null, sideA: p(7, 'Tạ Lê Vinh'), sideB: null },
  { id: 'ms-r1m07', code: 'R1·M07', state: 'live', liveCourt: 'Sân 1', sideA: p(3, 'Phan Minh Bảo', 8), sideB: p(14, 'Cao Khắc Lâm', 11) },
  { id: 'ms-r1m08', code: 'R1·M08', state: 'completed', liveCourt: null, sideA: p(6, 'Lý Văn Quân', 21, true), sideB: p(11, 'Mai Tấn Phú', 18) },
]
const MS_QF: BracketMatch[] = [
  { id: 'ms-qf01', code: 'QF·M01', state: 'pending', liveCourt: null, sideA: p(1, 'Nguyễn Văn Anh'), sideB: p(8, 'Trần Quang Khang') },
  { id: 'ms-qf02', code: 'QF·M02', state: 'pending', liveCourt: null, sideA: ph('winner M03'), sideB: p(5, 'Hoàng Minh Đức') },
  { id: 'ms-qf03', code: 'QF·M03', state: 'pending', liveCourt: null, sideA: p(2, 'Đặng Ngọc Nam'), sideB: p(7, 'Tạ Lê Vinh') },
  { id: 'ms-qf04', code: 'QF·M04', state: 'pending', liveCourt: null, sideA: ph('winner M07'), sideB: p(6, 'Lý Văn Quân') },
]
const MS_SF: BracketMatch[] = [
  { id: 'ms-sf01', code: 'SF·M01', state: 'pending', liveCourt: null, sideA: ph('winner QF1'), sideB: ph('winner QF2') },
  { id: 'ms-sf02', code: 'SF·M02', state: 'pending', liveCourt: null, sideA: ph('winner QF3'), sideB: ph('winner QF4') },
]
const MS_F: BracketMatch[] = [
  { id: 'ms-f01', code: 'F·M01', state: 'pending', liveCourt: null, sideA: ph('winner SF1'), sideB: ph('winner SF2') },
]
const MS_KO: KnockoutRound[] = [
  { key: 'R1', label: 'Round 1', countLabel: '8 trận', matches: MS_R1 },
  { key: 'QF', label: 'Tứ kết', countLabel: '4', matches: MS_QF },
  { key: 'SF', label: 'Bán kết', countLabel: '2', matches: MS_SF },
  { key: 'F', label: 'Chung kết', countLabel: '1', matches: MS_F },
]

// ─── WS · Round robin ───────────────────────────────────────────────────────
function standing(rank: number, name: string, seed: number | null, played: number, won: number, lost: number, gameDiff: number, points: number, qualified = false): StandingRow {
  return { rank, name, seed, played, won, lost, gameDiff, points, qualified }
}
const WS_STANDINGS: StandingRow[] = [
  standing(1, 'Phạm Thị Mai', 1, 7, 7, 0, 12, 14),
  standing(2, 'Nguyễn Thị Lan', 2, 7, 6, 1, 9, 12),
  standing(3, 'Lê Thị Hoa', 4, 7, 5, 2, 5, 10),
  standing(4, 'Vũ Thị Hà', 3, 7, 4, 3, 2, 8),
  standing(5, 'Đặng Thị Nga', null, 7, 3, 4, -1, 6),
  standing(6, 'Trần Thị Thu', null, 7, 2, 5, -4, 4),
  standing(7, 'Bùi Thị Vy', null, 7, 1, 6, -8, 2),
  standing(8, 'Hoàng Thị Linh', null, 7, 0, 7, -15, 0),
]
const WS_MATCHES: BracketMatch[] = [
  { id: 'ws1', code: 'RR·01', state: 'completed', liveCourt: null, sideA: p(null, 'Phạm Thị Mai', 2, true), sideB: p(null, 'Hoàng Thị Linh', 0) },
  { id: 'ws2', code: 'RR·02', state: 'completed', liveCourt: null, sideA: p(null, 'Nguyễn Thị Lan', 2, true), sideB: p(null, 'Bùi Thị Vy', 1) },
  { id: 'ws3', code: 'RR·03', state: 'live', liveCourt: 'Sân 3', sideA: p(null, 'Lê Thị Hoa', 1), sideB: p(null, 'Vũ Thị Hà', 1) },
  { id: 'ws4', code: 'RR·04', state: 'pending', liveCourt: null, sideA: p(null, 'Đặng Thị Nga'), sideB: p(null, 'Trần Thị Thu') },
  { id: 'ws5', code: 'RR·05', state: 'pending', liveCourt: null, sideA: p(null, 'Phạm Thị Mai'), sideB: p(null, 'Nguyễn Thị Lan') },
]

// ─── MD · Group + KO (đôi nam) ───────────────────────────────────────────────
const MD_GROUPS = [
  { name: 'Bảng A', standings: [standing(1, 'Đặng Văn Sơn / Lê Minh Tú', 1, 2, 2, 0, 5, 4, true), standing(2, 'Trần Gia Long / Phạm Văn Hải', null, 2, 1, 1, 0, 2), standing(3, 'Lê Trung Kiên / Đỗ Anh Vũ', null, 2, 0, 2, -5, 0)] },
  { name: 'Bảng B', standings: [standing(1, 'Hoàng Ngọc Nam / Bùi Tiến Đạt', 2, 2, 2, 0, 4, 4, true), standing(2, 'Nguyễn Hồng Phúc / Vũ Bình An', null, 2, 1, 1, 1, 2), standing(3, 'Ngô Thanh Bình / Lý Minh Tâm', null, 2, 0, 2, -5, 0)] },
  { name: 'Bảng C', standings: [standing(1, 'Phan Đăng Khoa / Tạ Quang Huy', 3, 2, 2, 0, 6, 4, true), standing(2, 'Vũ Mạnh Dũng / Cao Khắc Lâm', null, 2, 1, 1, -1, 2), standing(3, 'Đỗ Văn Hòa / Mai Tấn Phú', null, 2, 0, 2, -5, 0)] },
  { name: 'Bảng D', standings: [standing(1, 'Lý Văn Quân / Phan Minh Bảo', 4, 2, 2, 0, 4, 4, true), standing(2, 'Trần Đức Tài / Ngô Phú Lộc', null, 2, 1, 1, 0, 2), standing(3, 'Bùi Công Minh / Hồ Thành Nhân', null, 2, 0, 2, -4, 0)] },
]
const MD_KO: KnockoutRound[] = [
  {
    key: 'SF', label: 'Bán kết', countLabel: '2', matches: [
      { id: 'md-sf1', code: 'SF·M01', state: 'pending', liveCourt: null, sideA: p(null, 'Đặng Văn Sơn / Lê Minh Tú'), sideB: p(null, 'Lý Văn Quân / Phan Minh Bảo') },
      { id: 'md-sf2', code: 'SF·M02', state: 'pending', liveCourt: null, sideA: p(null, 'Hoàng Ngọc Nam / Bùi Tiến Đạt'), sideB: p(null, 'Phan Đăng Khoa / Tạ Quang Huy') },
    ],
  },
  {
    key: 'F', label: 'Chung kết', countLabel: '1', matches: [
      { id: 'md-f1', code: 'F·M01', state: 'pending', liveCourt: null, sideA: ph('winner SF1'), sideB: ph('winner SF2') },
    ],
  },
]

// ─── MX · Đôi nam-nữ · Single elimination (demo hạng mục đánh đôi) ──────────
const MX_QF: BracketMatch[] = [
  { id: 'mx-qf01', code: 'QF·M01', state: 'completed', liveCourt: null, sideA: p(1, 'Đặng Văn Sơn / Lê Thị Mai', 21, true), sideB: p(8, 'Trần Gia Long / Phạm Thị Hà', 17) },
  { id: 'mx-qf02', code: 'QF·M02', state: 'live', liveCourt: 'Sân 3', sideA: p(4, 'Nguyễn Hồng Phúc / Vũ Thị An', 15), sideB: p(5, 'Lê Trung Kiên / Đỗ Thị Vân', 18) },
  { id: 'mx-qf03', code: 'QF·M03', state: 'completed', liveCourt: null, sideA: p(2, 'Hoàng Ngọc Nam / Bùi Thị Đào', 21, true), sideB: p(7, 'Ngô Thanh Bình / Lý Thị Tâm', 14) },
  { id: 'mx-qf04', code: 'QF·M04', state: 'pending', liveCourt: null, sideA: p(3, 'Phan Đăng Khoa / Tạ Thị Huyền'), sideB: p(6, 'Vũ Mạnh Dũng / Cao Thị Lan') },
]
const MX_SF: BracketMatch[] = [
  { id: 'mx-sf01', code: 'SF·M01', state: 'pending', liveCourt: null, sideA: p(1, 'Đặng Văn Sơn / Lê Thị Mai'), sideB: ph('winner QF2') },
  { id: 'mx-sf02', code: 'SF·M02', state: 'pending', liveCourt: null, sideA: p(2, 'Hoàng Ngọc Nam / Bùi Thị Đào'), sideB: ph('winner QF4') },
]
const MX_F: BracketMatch[] = [
  { id: 'mx-f01', code: 'F·M01', state: 'pending', liveCourt: null, sideA: ph('winner SF1'), sideB: ph('winner SF2') },
]
const MX_KO: KnockoutRound[] = [
  { key: 'QF', label: 'Tứ kết', countLabel: '4 trận', matches: MX_QF },
  { key: 'SF', label: 'Bán kết', countLabel: '2', matches: MX_SF },
  { key: 'F', label: 'Chung kết', countLabel: '1', matches: MX_F },
]

export const MOCK_BRACKETS: CategoryBracket[] = [
  {
    id: 'cat-ms', code: 'MS', name: 'Đơn nam', countLabel: '16 VĐV', format: 'single_elim',
    meta: { mode: 'Seeded · crossover', bracketSize: 16, byes: 0, roundsLabel: '4 · R1 → F', activeVersion: 'v2', isLive: true, versionsCount: 3 },
    knockout: MS_KO,
  },
  {
    id: 'cat-ws', code: 'WS', name: 'Đơn nữ', countLabel: '8', format: 'round_robin',
    meta: { mode: 'Vòng tròn 1 lượt', bracketSize: null, byes: 0, roundsLabel: '7 lượt', activeVersion: 'v1', isLive: true, versionsCount: 1 },
    roundRobin: { standings: WS_STANDINGS, matches: WS_MATCHES },
  },
  {
    id: 'cat-md', code: 'MD', name: 'Đôi nam', countLabel: '12', format: 'group_ko',
    meta: { mode: 'Group + KO', bracketSize: null, byes: 0, roundsLabel: '4 bảng → SF → F', activeVersion: 'v1', isLive: false, versionsCount: 1 },
    groupKo: { qualifyPerGroup: 1, groups: MD_GROUPS, knockout: MD_KO },
  },
  {
    id: 'cat-wd', code: 'WD', name: 'Đôi nữ', countLabel: '8', format: 'round_robin',
    meta: { mode: 'Vòng tròn 1 lượt', bracketSize: null, byes: 0, roundsLabel: '7 lượt', activeVersion: 'v1', isLive: false, versionsCount: 1 },
    roundRobin: { standings: WS_STANDINGS, matches: WS_MATCHES },
  },
  {
    id: 'cat-mx', code: 'MX', name: 'Đôi nam-nữ', countLabel: '8 cặp', format: 'single_elim',
    meta: { mode: 'Seeded · crossover', bracketSize: 8, byes: 0, roundsLabel: '3 · QF → F', activeVersion: 'v1', isLive: true, versionsCount: 2 },
    knockout: MX_KO,
  },
]
