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
  registrationStatus: CategoryRegistrationStatus,
): Promise<void> {
  void tid // tid not needed — api resolves tournament from categoryId
  const action = registrationStatus === 'open'
    ? 'open'
    : registrationStatus === 'closed'
      ? 'close'
      : 'reopen'
  await api.post<{ ok: boolean }>(`/categories/${categoryId}/registration/${action}`)
}
