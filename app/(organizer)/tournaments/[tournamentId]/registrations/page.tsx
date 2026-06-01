import { RegistrationsClient } from './_components/RegistrationsClient'
import type { RegistrationRow, CategoryFilterOption } from '@/lib/types/registration'

// Placeholder — thay bằng Firestore query categories của giải
const MOCK_CATEGORIES: CategoryFilterOption[] = [
  { id: 'cat-ms', code: 'MS', name: 'Đơn nam' },
  { id: 'cat-ws', code: 'WS', name: 'Đơn nữ' },
  { id: 'cat-md', code: 'MD', name: 'Đôi nam' },
  { id: 'cat-mx', code: 'MX', name: 'Đôi nam nữ' },
  { id: 'cat-open', code: 'OPEN', name: 'Đôi tự do' },
]

// Placeholder — thay bằng Firestore query registrations
const MOCK_REGISTRATIONS: RegistrationRow[] = [
  { id: 'r1', athleteName: 'Nguyễn Văn Anh', cccdLast4: '1234', phoneMasked: '0903…', partnerName: null, categoryId: 'cat-ms', categoryCode: 'MS', fee: 100000, paymentStatus: 'paid', registeredAt: '2026-05-12T19:23:00', status: 'approved' },
  { id: 'r2', athleteName: 'Lê Hoàng Hùng', cccdLast4: '5612', phoneMasked: '0987…', partnerName: 'Nguyễn T. Thảo', categoryId: 'cat-mx', categoryCode: 'MX', fee: 250000, paymentStatus: 'paid', registeredAt: '2026-05-13T08:11:00', status: 'approved' },
  { id: 'r3', athleteName: 'Hoàng Minh Đức', cccdLast4: '8821', phoneMasked: '0912…', partnerName: null, categoryId: 'cat-ms', categoryCode: 'MS', fee: 100000, paymentStatus: 'unpaid', registeredAt: '2026-05-15T14:02:00', status: 'pending' },
  { id: 'r4', athleteName: 'Phan Minh Bảo', cccdLast4: '4471', phoneMasked: '0938…', partnerName: 'Cao K. Lâm', categoryId: 'cat-md', categoryCode: 'MD', fee: 200000, paymentStatus: 'paid', registeredAt: '2026-05-16T11:48:00', status: 'approved' },
  { id: 'r5', athleteName: 'Trần Quang Khang', cccdLast4: '6602', phoneMasked: '0901…', partnerName: null, categoryId: 'cat-ms', categoryCode: 'MS', fee: 100000, paymentStatus: 'unpaid', registeredAt: '2026-05-17T20:31:00', status: 'approved' },
  { id: 'r6', athleteName: 'Phạm Ngọc Hà', cccdLast4: '7790', phoneMasked: '0966…', partnerName: 'Đỗ Khánh', categoryId: 'cat-mx', categoryCode: 'MX', fee: 250000, paymentStatus: 'unpaid', registeredAt: '2026-05-18T09:14:00', status: 'pending' },
  { id: 'r7', athleteName: 'Vũ Hoài Lan', cccdLast4: '3340', phoneMasked: '0922…', partnerName: 'Hoàng M. Đức', categoryId: 'cat-mx', categoryCode: 'MX', fee: 250000, paymentStatus: 'unpaid', registeredAt: '2026-05-19T16:55:00', status: 'withdrawn' },
]

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return (
    <RegistrationsClient
      tournamentId={tournamentId}
      categories={MOCK_CATEGORIES}
      registrations={MOCK_REGISTRATIONS}
      totalCount={72}
    />
  )
}
