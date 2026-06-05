import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCourtPageData, addCourt, assignReferee, startMatch } from './client'
import type { CourtWithState, RefereeOption } from '@/lib/types/court'

type CourtPageData = { courts: CourtWithState[]; referees: RefereeOption[] }

export const courtKeys = {
  page: (tid: string) => ['courts', tid] as const,
}

export function useCourts(tournamentId: string) {
  return useQuery({
    queryKey: courtKeys.page(tournamentId),
    queryFn: () => fetchCourtPageData(tournamentId),
    staleTime: 15_000,
  })
}

export function useAddCourt(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, order }: { name: string; order: number }) =>
      addCourt(tournamentId, name, order),
    meta: {
      success: (_data: unknown, vars: unknown) =>
        `Đã thêm "${(vars as { name: string }).name}"`,
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courtKeys.page(tournamentId) })
    },
  })
}

export function useAssignReferee(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courtId, uid }: { courtId: string; uid: string | null }) =>
      assignReferee(tournamentId, courtId, uid),
    meta: {
      success: (_data: unknown, vars: unknown) =>
        (vars as { uid: string | null }).uid ? 'Đã gán trọng tài' : 'Đã gỡ trọng tài',
    },
    onMutate: async ({ courtId, uid }) => {
      await qc.cancelQueries({ queryKey: courtKeys.page(tournamentId) })
      const prev = qc.getQueryData<CourtPageData>(courtKeys.page(tournamentId))
      qc.setQueryData<CourtPageData>(courtKeys.page(tournamentId), (old) =>
        old
          ? { ...old, courts: old.courts.map((c) => (c.id === courtId ? { ...c, currentRefereeUid: uid } : c)) }
          : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(courtKeys.page(tournamentId), ctx.prev)
      // toast hiện bởi MutationCache.onError
    },
    onSettled: () => qc.invalidateQueries({ queryKey: courtKeys.page(tournamentId) }),
  })
}

export function useStartMatch(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (courtId: string) => startMatch(tournamentId, courtId),
    meta: { success: 'Đã bắt đầu trận' },
    onMutate: async (courtId) => {
      await qc.cancelQueries({ queryKey: courtKeys.page(tournamentId) })
      const prev = qc.getQueryData<CourtPageData>(courtKeys.page(tournamentId))
      qc.setQueryData<CourtPageData>(courtKeys.page(tournamentId), (old) =>
        old
          ? {
              ...old,
              courts: old.courts.map((c) =>
                c.id === courtId && c.match
                  ? { ...c, status: 'in_use', match: { ...c.match, gameLabel: 'Game 1', scoreA: 0, scoreB: 0 } }
                  : c,
              ),
            }
          : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(courtKeys.page(tournamentId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: courtKeys.page(tournamentId) }),
  })
}
