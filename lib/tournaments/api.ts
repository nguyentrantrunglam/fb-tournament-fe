import { httpsCallable } from 'firebase/functions'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getClientFunctions, getClientDb, getClientStorage } from '@/lib/firebase/client'
import type { TournamentStatus, TournamentSponsor } from '@/lib/types/tournament'
import type { CategoryWithStats, GenderRequirement, CategoryFormat } from '@/lib/types/category'
import type { RegistrationRow, CategoryFilterOption, RegistrationStatus, RegistrationPaymentStatus } from '@/lib/types/registration'
import type { CreateTournamentFormData } from '@/lib/validators/create-tournament'
import type { CreateCategoryInput } from '@/lib/validators/category'

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

// Dữ liệu giải dùng cho chrome/khu BTC (đọc client theo rule owner/public)
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
  ownerUid: string
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

// ─── Callables ────────────────────────────────────────────────────────────────

export async function createTournament(data: CreateTournamentFormData): Promise<{ id: string; slug: string }> {
  const fn = httpsCallable<CreateTournamentFormData, { id: string; slug: string }>(getClientFunctions(), 'createTournament')
  return (await fn(data)).data
}

export async function listMyTournaments(): Promise<MyTournament[]> {
  const fn = httpsCallable<unknown, { tournaments: MyTournament[] }>(getClientFunctions(), 'listMyTournaments')
  return (await fn({})).data.tournaments
}

export async function createCategory(tournamentId: string, data: CreateCategoryInput): Promise<{ id: string }> {
  const fn = httpsCallable<unknown, { id: string }>(getClientFunctions(), 'createCategory')
  return (await fn({ tournamentId, ...data })).data
}

export async function updateCategory(tournamentId: string, categoryId: string, data: CreateCategoryInput): Promise<void> {
  const fn = httpsCallable(getClientFunctions(), 'updateCategory')
  await fn({ tournamentId, categoryId, ...data })
}

export async function updateTournament(id: string, patch: UpdateTournamentPatch): Promise<void> {
  const fn = httpsCallable(getClientFunctions(), 'updateTournament')
  await fn({ id, ...patch })
}

// Upload ảnh giải lên Storage → trả downloadURL (lưu vào doc qua updateTournament)
export async function uploadTournamentImage(
  tid: string,
  kind: 'banner' | 'logo' | 'sponsor',
  file: File,
): Promise<string> {
  const path = `tournaments/${tid}/${kind}-${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const r = storageRef(getClientStorage(), path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

// ─── Client reads (rule: owner/public) ────────────────────────────────────────

// Map raw Firestore tournament doc → TournamentDoc (dùng chung fetch + context)
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
    ownerUid: (t['ownerUid'] as string) ?? '',
  }
}

export async function fetchTournament(id: string): Promise<TournamentDoc | null> {
  const snap = await getDoc(doc(getClientDb(), 'tournaments', id))
  if (!snap.exists()) return null
  return mapTournamentDoc(snap.id, snap.data())
}

export async function fetchCategories(tid: string): Promise<CategoryWithStats[]> {
  const snap = await getDocs(collection(getClientDb(), `tournaments/${tid}/categories`))
  return snap.docs.map((d) => {
    const c = d.data()
    return {
      id: d.id,
      tournamentId: tid,
      code: c['code'] ?? '',
      name: c['name'] ?? '',
      playerCount: (c['playerCount'] ?? 1) as 1 | 2,
      genderRequirement: (c['genderRequirement'] ?? 'unrestricted') as GenderRequirement,
      format: (c['format'] ?? 'single_elim') as CategoryFormat,
      bestOf: (c['bestOf'] ?? 3) as 1 | 3 | 5,
      fee: c['fee'] ?? 0,
      maxTeams: c['maxTeams'] ?? 0,
      registrationDeadline: c['registrationDeadline'] ?? '',
      registrationStatus: c['registrationStatus'] ?? 'not_open',
      // Stats denormalized — tính từ registrations/matches ở phase sau
      slotFilled: c['slotFilled'] ?? 0,
      slotApproved: c['slotApproved'] ?? 0,
      slotPaid: c['slotPaid'] ?? 0,
      byeCount: c['byeCount'] ?? 0,
      currentRound: c['currentRound'] ?? null,
    }
  })
}

export async function fetchCategoryFilterOptions(tid: string): Promise<CategoryFilterOption[]> {
  const snap = await getDocs(collection(getClientDb(), `tournaments/${tid}/categories`))
  return snap.docs.map((d) => ({ id: d.id, code: d.data()['code'] ?? '', name: d.data()['name'] ?? '' }))
}

export async function fetchRegistrations(tid: string): Promise<RegistrationRow[]> {
  const snap = await getDocs(collection(getClientDb(), `tournaments/${tid}/registrations`))
  return snap.docs.map((d) => {
    const r = d.data()
    return {
      id: d.id,
      athleteName: r['athleteName'] ?? '',
      cccdLast4: r['cccdLast4'] ?? '',
      phoneMasked: r['phoneMasked'] ?? '',
      partnerName: r['partnerName'] ?? null,
      categoryId: r['categoryId'] ?? '',
      categoryCode: r['categoryCode'] ?? '',
      fee: r['fee'] ?? 0,
      paymentStatus: (r['paymentStatus'] ?? 'unpaid') as RegistrationPaymentStatus,
      registeredAt: r['registeredAt'] ?? '',
      status: (r['status'] ?? 'pending') as RegistrationStatus,
    }
  })
}
