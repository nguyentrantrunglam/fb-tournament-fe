import { getClientAuth } from '@/lib/firebase/client'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryFeeItem, CategoryRegistrationStatus } from '@/lib/types/category'

export type FeesData = {
  paymentConfig: PaymentConfig | null
  categories: CategoryFeeItem[]
}

async function getToken(): Promise<string> {
  const user = getClientAuth().currentUser
  if (!user) throw new Error('Chưa đăng nhập')
  return user.getIdToken()
}

async function feesApi(tid: string, method: string, body?: object): Promise<Response> {
  const token = await getToken()
  return fetch(`/api/tournaments/${tid}/fees`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

export async function fetchFeesData(tid: string): Promise<FeesData> {
  const res = await feesApi(tid, 'GET')
  if (!res.ok) return { paymentConfig: null, categories: [] }
  return (await res.json()) as FeesData
}

export async function saveFees(
  tid: string,
  paymentConfig: PaymentConfig,
  categoryFees: { id: string; fee: number }[],
): Promise<void> {
  const res = await feesApi(tid, 'PUT', { paymentConfig, categoryFees })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Không thể lưu cấu hình')
  }
}

export async function toggleRegistration(
  tid: string,
  categoryId: string,
  registrationStatus: CategoryRegistrationStatus,
): Promise<void> {
  const res = await feesApi(tid, 'PATCH', { categoryId, registrationStatus })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Không thể thay đổi trạng thái đăng ký')
  }
}
