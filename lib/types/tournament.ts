import type { PaymentConfig } from './payment'

// status từ system-architecture.md §ERD Tournament
export type TournamentStatus = 'draft' | 'open' | 'running' | 'completed' | 'cancelled'

// Bậc tài trợ — hiển thị phân nhóm ở trang public
export type SponsorTier = 'diamond' | 'gold' | 'silver' | 'operator' | 'media'

export type TournamentSponsor = {
  id: string
  tier: SponsorTier
  name: string
  logoUrl: string | null
  link: string         // website / fanpage
  description: string
}

export type Tournament = {
  id: string
  name: string
  slug: string
  description: string
  startDate: string // ISO YYYY-MM-DD
  endDate: string
  location: string
  bannerUrl: string | null  // banner public 2000×1000
  logoUrl: string | null    // logo giải (vuông)
  rulesText: string | null  // thể lệ (markdown)
  sponsors: TournamentSponsor[]
  paymentConfig: PaymentConfig | null
  isPublic: boolean
  ownerUid: string
  status: TournamentStatus
  createdAt: string
}

export type TournamentCategory = {
  id: string
  tournamentId: string
  code: string
  name: string
  playerCount: 1 | 2
  genderRequirement: 'men_only' | 'women_only' | 'mixed_pair' | 'unrestricted'
  format: 'single_elim'
  bestOf: 1 | 3 | 5
  fee: number
  maxTeams: number
  registrationStatus: 'not_open' | 'open' | 'closed'
}
