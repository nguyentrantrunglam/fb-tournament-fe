import { api } from '@/lib/api/client'
import type { TournamentStatus, TournamentSponsor } from '@/lib/types/tournament'
import type { CategoryWithStats, GenderRequirement, CategoryFormat } from '@/lib/types/category'
import type { RegistrationRow, CategoryFilterOption, RegistrationStatus, RegistrationPaymentStatus } from '@/lib/types/registration'
import type { CreateTournamentFormData } from '@/lib/validators/create-tournament'
import type { CreateCategoryInput } from '@/lib/validators/category'

// ─── Response types ────────────────────────────────────────────────────────────

export type MyTournament = {
  id: string
  name: string
  slug: string
  status: TournamentStatus
  startDate: string | null
  endDate: string | null
  location: string
  bannerUrl: string | null
  logoUrl: string | null
  isOwner: boolean
  createdAt: number | null
}

export type TournamentDoc = {
  id: string
  name: string
  slug: string
  description: string
  status: TournamentStatus
  startDate: string
  endDate: string
  location: string
  rulesText: string | null
  sponsors: TournamentSponsor[]
  bannerUrl: string | null
  logoUrl: string | null
  isPublic: boolean
  // ownerUserId replaces ownerUid — callers that need to check ownership use this field
  ownerUserId: string
}

export type UpdateTournamentPatch = Partial<{
  name: string
  slug: string
  description: string
  startDate: string
  endDate: string
  location: string
  rulesText: string | null
  sponsors: TournamentSponsor[]
  bannerUrl: string | null
  logoUrl: string | null
  isPublic: boolean
}>

// Raw shape from GET /tournaments/:tid (safeTournament in service)
type ApiTournamentDoc = {
  id: string
  name: string
  slug: string
  description?: string
  status: TournamentStatus
  startDate: string
  endDate: string
  location: string
  rulesText?: string | null
  sponsors?: TournamentSponsor[]
  bannerUrl?: string | null
  logoUrl?: string | null
  isPublic: boolean
  ownerUserId: string
  paymentConfig?: unknown
  createdAt?: string
}

function mapApiTournament(t: ApiTournamentDoc): TournamentDoc {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description ?? '',
    status: t.status,
    startDate: t.startDate ?? '',
    endDate: t.endDate ?? '',
    location: t.location ?? '',
    rulesText: t.rulesText ?? null,
    sponsors: t.sponsors ?? [],
    bannerUrl: t.bannerUrl ?? null,
    logoUrl: t.logoUrl ?? null,
    isPublic: t.isPublic,
    ownerUserId: t.ownerUserId ?? '',
  }
}

// ─── Tournament mutations ──────────────────────────────────────────────────────

export async function createTournament(data: CreateTournamentFormData): Promise<{ id: string; slug: string }> {
  return api.post<{ id: string; slug: string }>('/tournaments', data)
}

export async function updateTournament(id: string, patch: UpdateTournamentPatch): Promise<void> {
  // Filter out null values for exactOptionalPropertyTypes compliance — omit, don't send undefined
  const body: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) body[k] = v
  }
  await api.patch<TournamentDoc>(`/tournaments/${id}`, body)
}

// ─── Tournament queries ────────────────────────────────────────────────────────

export async function listMyTournaments(): Promise<MyTournament[]> {
  const res = await api.get<{ tournaments: ApiTournamentDoc[] }>('/tournaments/mine')
  return res.tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    startDate: t.startDate ?? null,
    endDate: t.endDate ?? null,
    location: t.location ?? '',
    bannerUrl: t.bannerUrl ?? null,
    logoUrl: t.logoUrl ?? null,
    isOwner: true, // listMine only returns tournaments the caller owns or has a role on
    createdAt: t.createdAt ? new Date(t.createdAt).getTime() : null,
  }))
}

export async function fetchTournament(id: string): Promise<TournamentDoc | null> {
  try {
    const t = await api.get<ApiTournamentDoc>(`/tournaments/${id}`)
    return mapApiTournament(t)
  } catch {
    return null
  }
}

// ─── Category mutations ────────────────────────────────────────────────────────

export async function createCategory(tournamentId: string, data: CreateCategoryInput): Promise<{ id: string }> {
  return api.post<{ id: string }>(`/tournaments/${tournamentId}/categories`, data)
}

export async function updateCategory(tournamentId: string, categoryId: string, data: CreateCategoryInput): Promise<void> {
  // /categories/:cid — tid not needed by api (CategoryTournamentRoleGuard resolves it)
  void tournamentId
  await api.patch<unknown>(`/categories/${categoryId}`, data)
}

// ─── Category queries ──────────────────────────────────────────────────────────

export async function fetchCategories(tid: string): Promise<CategoryWithStats[]> {
  const res = await api.get<{ categories: Record<string, unknown>[] }>(`/tournaments/${tid}/categories`)
  return (res.categories ?? []).map((c) => ({
    id: (c['id'] as string) ?? '',
    tournamentId: tid,
    code: (c['code'] as string) ?? '',
    name: (c['name'] as string) ?? '',
    playerCount: ((c['playerCount'] as 1 | 2) ?? 1),
    genderRequirement: ((c['genderRequirement'] as GenderRequirement) ?? 'unrestricted'),
    format: ((c['format'] as CategoryFormat) ?? 'single_elim'),
    bestOf: ((c['bestOf'] as 1 | 3 | 5) ?? 3),
    fee: (c['fee'] as number) ?? 0,
    maxTeams: (c['maxTeams'] as number) ?? 0,
    registrationDeadline: (c['registrationDeadline'] as string) ?? '',
    registrationStatus: (c['registrationStatus'] as CategoryWithStats['registrationStatus']) ?? 'not_open',
    slotFilled: (c['slotFilled'] as number) ?? 0,
    slotApproved: (c['slotApproved'] as number) ?? 0,
    slotPaid: (c['slotPaid'] as number) ?? 0,
    byeCount: (c['byeCount'] as number) ?? 0,
    currentRound: c['currentRound'] != null ? String(c['currentRound']) : null,
  }))
}

// ─── Storage upload (presign → PUT → publicUrl) ────────────────────────────────

export async function uploadTournamentImage(
  tid: string,
  kind: 'banner' | 'logo' | 'sponsor',
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `tournaments/${tid}/${kind}-${Date.now()}.${ext}`
  const contentType = file.type || 'image/jpeg'

  const { uploadUrl, publicUrl } = await api.post<{ uploadUrl: string; publicUrl: string }>(
    '/storage/presign',
    { key, contentType },
  )

  // PUT directly to DigitalOcean Spaces (no auth header — presigned URL is self-authenticating)
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!putRes.ok) {
    throw new Error(`Upload thất bại: ${putRes.status} ${putRes.statusText}`)
  }

  return publicUrl
}

// ─── Registration queries (BTC panel) ─────────────────────────────────────────

export async function fetchCategoryFilterOptions(tid: string): Promise<CategoryFilterOption[]> {
  try {
    const res = await api.get<{ categories: Array<{ id: string; code: string; name: string }> }>(
      `/tournaments/${tid}/categories`,
    )
    return (res.categories ?? []).map((c) => ({ id: c.id, code: c.code, name: c.name }))
  } catch {
    return []
  }
}

export async function fetchRegistrations(tid: string): Promise<RegistrationRow[]> {
  // TODO: GET /tournaments/:tid/registrations endpoint not yet implemented (Phase 4).
  // Returns empty array so the registrations page renders without crashing.
  void tid
  return []
}

// ─── Kept for compatibility ────────────────────────────────────────────────────

// Kept for compatibility with tournament-context.tsx which still calls mapTournamentDoc
// during the transition. Remove when tournament-context is refactored to REST polling.
export function mapTournamentDoc(id: string, t: Record<string, unknown>): TournamentDoc {
  return {
    id,
    name: (t['name'] as string) ?? '',
    slug: (t['slug'] as string) ?? '',
    description: (t['description'] as string) ?? '',
    status: ((t['status'] as TournamentStatus) ?? 'draft'),
    startDate: (t['startDate'] as string) ?? '',
    endDate: (t['endDate'] as string) ?? '',
    location: (t['location'] as string) ?? '',
    rulesText: (t['rulesText'] as string | null) ?? null,
    sponsors: (t['sponsors'] as TournamentSponsor[]) ?? [],
    bannerUrl: (t['bannerUrl'] as string | null) ?? null,
    logoUrl: (t['logoUrl'] as string | null) ?? null,
    isPublic: (t['isPublic'] as boolean) ?? false,
    ownerUserId: (t['ownerUserId'] as string) ?? (t['ownerUid'] as string) ?? '',
  }
}
