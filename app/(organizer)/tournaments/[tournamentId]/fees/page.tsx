import { FeesQrClient } from './_components/FeesQrClient'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryFeeItem } from '@/lib/types/category'

// Placeholder — thay bằng Firestore read tournament.paymentConfig khi backend xong
const MOCK_PAYMENT: PaymentConfig = {
  accountHolder: 'PHAM HOANG',
  accountNumber: '9704 0000 1234 5678',
  bankCode: 'ICB',
  transferMemoTemplate: 'SAIGON26 {tên_VĐV} {mã_hạng_mục}',
  qrUrl: null,
}

// Placeholder — thay bằng Firestore query categories của giải
const MOCK_CATEGORIES: CategoryFeeItem[] = [
  { id: 'cat-ms', code: 'MS', name: 'Đơn nam', playerCount: 1, genderRequirement: 'men_only', fee: 150000, registrationStatus: 'open' },
  { id: 'cat-ws', code: 'WS', name: 'Đơn nữ', playerCount: 1, genderRequirement: 'women_only', fee: 150000, registrationStatus: 'open' },
  { id: 'cat-md', code: 'MD', name: 'Đôi nam', playerCount: 2, genderRequirement: 'men_only', fee: 250000, registrationStatus: 'closed' },
  { id: 'cat-mx', code: 'MX', name: 'Đôi nam nữ', playerCount: 2, genderRequirement: 'mixed_pair', fee: 250000, registrationStatus: 'open' },
  { id: 'cat-open', code: 'OPEN', name: 'Đôi tự do', playerCount: 2, genderRequirement: 'unrestricted', fee: 0, registrationStatus: 'not_open' },
]

export default async function FeesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return (
    <FeesQrClient
      tournamentId={tournamentId}
      initial={MOCK_PAYMENT}
      initialCategories={MOCK_CATEGORIES}
    />
  )
}
