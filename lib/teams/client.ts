import { api } from '@/lib/api/client'
import type { CategoryTeams, TeamEntry, TeamPlayer } from '@/lib/types/team'

// ─── API response shapes ───────────────────────────────────────────────────────

type ApiPlayer = {
  name: string
  gender: 'male' | 'female' | null
  dob: string | null
  cccd: string | null
  phone: string | null
}

type ApiTeam = {
  id: string
  seed: number | null
  teamPhotoUrl: string | null
  players: ApiPlayer[]
}

type ApiCategory = {
  id: string
  code: string
  name: string
  playerCount: 1 | 2
  approvedCount: number
  seededCount: number
  teams: ApiTeam[]
}

type TeamsResponse = { categories: ApiCategory[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** First letter of first word + first letter of last word, uppercased. */
function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

function mapTeam(raw: ApiTeam): TeamEntry {
  const players: TeamPlayer[] = raw.players.map((p) => ({
    name: p.name,
    initials: computeInitials(p.name),
    gender: p.gender ?? null,
    dob: p.dob ?? null,
    cccd: p.cccd ?? null,
    phone: p.phone ?? null,
  }))
  return { id: raw.id, seed: raw.seed, players, teamPhotoUrl: raw.teamPhotoUrl }
}

function mapCategory(raw: ApiCategory): CategoryTeams {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    playerCount: raw.playerCount,
    approvedCount: raw.approvedCount,
    seededCount: raw.seededCount,
    teams: raw.teams.map(mapTeam),
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchTeams(tournamentId: string): Promise<CategoryTeams[]> {
  const res = await api.get<TeamsResponse>(`/tournaments/${tournamentId}/teams`)
  return res.categories.map(mapCategory)
}
