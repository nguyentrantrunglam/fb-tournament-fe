// Hỗ trợ 3 thể thức. Lưu ý: schema hiện tại (Category.format) mới chỉ 'single_elim';
// round_robin + group_ko là mở rộng (spec riêng ở P4 theo bracket-algorithm-spec.md).
export type BracketFormat = 'single_elim' | 'round_robin' | 'group_ko'

export type MatchState = 'pending' | 'live' | 'completed' | 'bye'

// 1 phía của trận. placeholder dùng khi chưa biết người (vd "winner M03").
export type MatchSide = {
  seed: number | null
  name: string | null
  placeholder: string | null // "winner QF1" — hiển thị italic khi name null
  score: number | null
  isWinner: boolean
}

export type BracketMatch = {
  id: string
  code: string        // "R1·M01", "QF·M01"
  state: MatchState
  liveCourt: string | null // "Sân 2" khi state=live
  sideA: MatchSide
  sideB: MatchSide | null  // null = bye (phantom side)
}

export type KnockoutRound = {
  key: string          // 'R1' | 'QF' | 'SF' | 'F'
  label: string        // 'ROUND 1' | 'TỨ KẾT' | 'BÁN KẾT' | 'CHUNG KẾT'
  countLabel: string   // '8 trận' | '4' | '2'
  matches: BracketMatch[]
}

// Dòng bảng xếp hạng (round-robin / group)
export type StandingRow = {
  rank: number
  name: string
  seed: number | null
  played: number
  won: number
  lost: number
  gameDiff: number // hiệu số game
  points: number
  qualified: boolean // top N qua vòng trong (group_ko)
}

export type RoundRobinView = {
  standings: StandingRow[]
  matches: BracketMatch[] // toàn bộ cặp đấu
}

export type Group = {
  name: string // 'Bảng A'
  standings: StandingRow[]
}

export type GroupKoView = {
  qualifyPerGroup: number
  groups: Group[]
  knockout: KnockoutRound[] // playoff giữa các đội qua vòng
}

export type BracketMeta = {
  mode: string        // 'Seeded · crossover' | 'Random'
  bracketSize: number | null
  byes: number
  roundsLabel: string // '4 · R1 → F'
  activeVersion: string // 'v2'
  isLive: boolean
  versionsCount: number
}

export type CategoryBracket = {
  id: string
  code: string
  name: string
  countLabel: string // '16 VĐV' | '8' | '12'
  format: BracketFormat
  meta: BracketMeta
  knockout?: KnockoutRound[]
  roundRobin?: RoundRobinView
  groupKo?: GroupKoView
}
