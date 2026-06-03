import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRefereesWithStats, batchInviteReferees } from './client'
import { courtKeys } from '@/lib/courts/queries'

export const refereeKeys = {
  list: (tid: string) => ['referees', tid] as const,
}

export function useReferees(tournamentId: string) {
  return useQuery({
    queryKey: refereeKeys.list(tournamentId),
    queryFn: () => fetchRefereesWithStats(tournamentId),
    staleTime: 30_000,
  })
}

export function useBatchInviteReferee(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uids: string[]) => batchInviteReferees(tournamentId, uids),
    meta: {
      success: (_data: unknown, uids: unknown) =>
        `Đã thêm ${(uids as string[]).length} trọng tài`,
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refereeKeys.list(tournamentId) })
      qc.invalidateQueries({ queryKey: courtKeys.page(tournamentId) })
    },
  })
}
