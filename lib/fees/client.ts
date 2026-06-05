import { api } from '@/lib/api/client'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryFeeItem, CategoryRegistrationStatus } from '@/lib/types/category'

export type FeesData = {
  paymentConfig: PaymentConfig | null
  categories: CategoryFeeItem[]
}

export async function fetchFeesData(tid: string): Promise<FeesData> {
  try {
    return await api.get<FeesData>(`/tournaments/${tid}/fees`)
  } catch {
    return { paymentConfig: null, categories: [] }
  }
}

export async function saveFees(
  tid: string,
  paymentConfig: PaymentConfig,
  categoryFees: { id: string; fee: number }[],
): Promise<void> {
  await api.patch<{ ok: boolean }>(`/tournaments/${tid}/fees`, { paymentConfig, categoryFees })
}

// Toggle registration status for a single category.
// API uses separate POST endpoints: /categories/:cid/registration/{open,close,reopen}
export async function toggleRegistration(
  tid: string,
  categoryId: string,
  currentStatus: CategoryRegistrationStatus,
  nextStatus: 'open' | 'closed',
): Promise<void> {
  void tid
  let action: string
  if (nextStatus === 'closed') {
    action = 'close'
  } else {
    // open from not_open → 'open'; reopen from closed → 'reopen'
    action = currentStatus === 'closed' ? 'reopen' : 'open'
  }
  await api.post<{ ok: boolean }>(`/categories/${categoryId}/registration/${action}`)
}
