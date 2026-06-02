export type CategoryRegistrationStatus = 'not_open' | 'open' | 'closed'
export type GenderRequirement = 'men_only' | 'women_only' | 'mixed_pair' | 'unrestricted'

// 3 thể thức (đồng bộ với lib/types/bracket.ts BracketFormat)
export type CategoryFormat = 'single_elim' | 'round_robin' | 'group_ko'

// Slim view cho màn Lệ phí & QR — set lệ phí từng nội dung
export type CategoryFeeItem = {
  id: string
  code: string
  name: string
  playerCount: 1 | 2
  genderRequirement: GenderRequirement
  fee: number // VND, 0 = miễn phí
  registrationStatus: CategoryRegistrationStatus
}

export type CategoryWithStats = {
  id: string
  tournamentId: string
  code: string
  name: string
  playerCount: 1 | 2
  genderRequirement: GenderRequirement
  format: CategoryFormat
  bestOf: 1 | 3 | 5
  fee: number               // VND, 0 = free
  maxTeams: number
  registrationDeadline: string  // ISO datetime
  registrationStatus: CategoryRegistrationStatus
  // Aggregated stats (denormalized from registrations)
  slotFilled: number   // approved + pending
  slotApproved: number
  slotPaid: number
  byeCount: number
  currentRound: string | null  // 'R1','QF','SF','F' — null nếu chưa bắt đầu
}
