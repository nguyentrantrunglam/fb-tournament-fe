import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchRegistrations,
  searchRegistrationUsers,
  createSelfRegistration,
  createOrganizerRegistration,
  bulkRegister,
  approveRegistration,
  rejectRegistration,
  withdrawRegistration,
  markPaidRegistration,
  unmarkPaidRegistration,
  setSeed,
  setTeamPhoto,
  type BulkRow,
} from './client'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const registrationKeys = {
  list: (tid: string) => ['registrations', tid] as const,
  userSearch: (tid: string, q: string, gender?: string) =>
    ['registration-user-search', tid, q, gender] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRegistrations(tournamentId: string) {
  return useQuery({
    queryKey: registrationKeys.list(tournamentId),
    queryFn: () => fetchRegistrations(tournamentId),
    staleTime: 30_000,
  })
}

/** Debounce at call-site; query only fires when q.length >= 2 to avoid noise. */
export function useUserSearch(tournamentId: string, q: string, gender?: string) {
  return useQuery({
    queryKey: registrationKeys.userSearch(tournamentId, q, gender),
    queryFn: () => searchRegistrationUsers(tournamentId, q, gender),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSelfRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      categoryId,
      partnerUserId,
    }: {
      categoryId: string
      partnerUserId?: string
    }) => createSelfRegistration(categoryId, partnerUserId),
    meta: { success: 'Đăng ký đang chờ duyệt' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useCreateOrganizerRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      categoryId,
      primaryUserId,
      partnerUserId,
    }: {
      categoryId: string
      primaryUserId: string
      partnerUserId?: string
    }) => createOrganizerRegistration(categoryId, primaryUserId, partnerUserId),
    meta: { success: 'Đã đăng ký hộ (tự động approved)' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useBulkRegister(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: BulkRow[]) => bulkRegister(tournamentId, rows),
    // Success/error details are shown in the result modal — no generic toast
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useApproveRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rid: string) => approveRegistration(rid),
    meta: { success: 'Đã duyệt đăng ký' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useRejectRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rid, reason }: { rid: string; reason?: string }) =>
      rejectRegistration(rid, reason),
    meta: { success: 'Đã từ chối đăng ký' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useWithdrawRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rid: string) => withdrawRegistration(rid),
    meta: { success: 'Đã rút đăng ký' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useMarkPaid(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rid: string) => markPaidRegistration(rid),
    meta: { success: 'Đã đánh dấu đã thu' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useUnmarkPaid(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rid: string) => unmarkPaidRegistration(rid),
    meta: { success: 'Đã bỏ đánh dấu đã thu' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useSetSeed(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rid, seed }: { rid: string; seed: number | null }) => setSeed(rid, seed),
    meta: {
      success: (_data: unknown, vars: unknown) => {
        const { seed } = vars as { seed: number | null }
        return seed == null ? 'Đã xoá seed' : `Đã đặt seed ${seed}`
      },
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}

export function useSetTeamPhoto(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rid, url }: { rid: string; url: string }) => setTeamPhoto(rid, url),
    meta: { success: 'Đã cập nhật ảnh đội' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    },
  })
}
