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
  ...buildFiller(),
]

// Sinh thêm đăng ký để demo infinite scroll (thực tế: Firestore cursor paging)
function buildFiller(): RegistrationRow[] {
  const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Ngô', 'Phan', 'Đỗ', 'Mai']
  const TEN = ['Văn An', 'Minh Bảo', 'Thị Cúc', 'Quốc Dũng', 'Hữu Đạt', 'Thu Hà', 'Gia Huy', 'Khánh Linh', 'Tuấn Minh', 'Ngọc Như', 'Phú Quý', 'Thanh Sơn']
  const CATS = [
    { id: 'cat-ms', code: 'MS', fee: 100000, double: false },
    { id: 'cat-ws', code: 'WS', fee: 100000, double: false },
    { id: 'cat-md', code: 'MD', fee: 200000, double: true },
    { id: 'cat-mx', code: 'MX', fee: 250000, double: true },
    { id: 'cat-open', code: 'OPEN', fee: 0, double: true },
  ]
  const STATUS: RegistrationRow['status'][] = ['approved', 'approved', 'approved', 'pending', 'rejected']

  return Array.from({ length: 53 }, (_, i) => {
    const cat = CATS[i % CATS.length]!
    const name = `${HO[i % HO.length]} ${TEN[(i * 3) % TEN.length]}`
    const partner = cat.double ? `${HO[(i * 2) % HO.length]} ${TEN[(i * 5) % TEN.length]}` : null
    const day = String(20 + (i % 9)).padStart(2, '0')
    const hh = String(8 + (i % 12)).padStart(2, '0')
    return {
      id: `rf${i + 8}`,
      athleteName: name,
      cccdLast4: String(1000 + i * 7).slice(-4),
      phoneMasked: `09${i % 10}${i % 8}…`,
      partnerName: partner,
      categoryId: cat.id,
      categoryCode: cat.code,
      fee: cat.fee,
      paymentStatus: i % 3 === 0 ? 'paid' : 'unpaid',
      registeredAt: `2026-05-${day}T${hh}:${String((i * 7) % 60).padStart(2, '0')}:00`,
      status: STATUS[i % STATUS.length]!,
    }
  })
}

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
      totalCount={MOCK_REGISTRATIONS.length}
    />
  )
}
