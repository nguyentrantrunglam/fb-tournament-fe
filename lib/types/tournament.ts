import type { PaymentConfig } from './payment'

// status từ system-architecture.md §ERD Tournament
export type TournamentStatus = 'draft' | 'open' | 'running' | 'completed' | 'cancelled'

export type TournamentSponsor = {
  name: string
  logoUrl: string
  websiteUrl: string
}

export type Tournament = {
  id: string
  name: string
  slug: string
  description: string
  startDate: string // ISO YYYY-MM-DD
  endDate: string
  location: string
  bannerUrl: string | null
  rulesText: string | null
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
