import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFeesData, saveFees, toggleRegistration, type FeesData } from './client'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryRegistrationStatus } from '@/lib/types/category'

export const feesKeys = {
  data: (tid: string) => ['fees', tid] as const,
}

export function useFeesData(tournamentId: string) {
  return useQuery({
    queryKey: feesKeys.data(tournamentId),
    queryFn: () => fetchFeesData(tournamentId),
  })
}

export function useSaveFees(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentConfig,
      categoryFees,
    }: {
      paymentConfig: PaymentConfig
      categoryFees: { id: string; fee: number }[]
    }) => saveFees(tournamentId, paymentConfig, categoryFees),
    meta: { success: 'Đã lưu cấu hình thanh toán' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feesKeys.data(tournamentId) })
    },
  })
}

export function useToggleRegistration(tournamentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      categoryId,
      currentStatus,
      nextStatus,
    }: {
      categoryId: string
      currentStatus: CategoryRegistrationStatus
      nextStatus: 'open' | 'closed'
    }) => toggleRegistration(tournamentId, categoryId, currentStatus, nextStatus),
    meta: {
      success: (_data: unknown, vars: unknown) => {
        const { nextStatus } = vars as { nextStatus: 'open' | 'closed' }
        return nextStatus === 'open' ? 'Đã mở đăng ký' : 'Đã đóng đăng ký'
      },
    },
    onMutate: async ({ categoryId, nextStatus }) => {
      await qc.cancelQueries({ queryKey: feesKeys.data(tournamentId) })
      const prev = qc.getQueryData<FeesData>(feesKeys.data(tournamentId))
      qc.setQueryData<FeesData>(feesKeys.data(tournamentId), (old) =>
        old
          ? { ...old, categories: old.categories.map((c) => (c.id === categoryId ? { ...c, registrationStatus: nextStatus } : c)) }
          : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(feesKeys.data(tournamentId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: feesKeys.data(tournamentId) }),
  })
}
