export type CategoryRegistrationStatus = 'not_open' | 'open' | 'closed'
export type GenderRequirement = 'men_only' | 'women_only' | 'mixed_pair' | 'unrestricted'

export type CategoryWithStats = {
  id: string
  tournamentId: string
  code: string
  name: string
  playerCount: 1 | 2
  genderRequirement: GenderRequirement
  format: 'single_elim'
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
