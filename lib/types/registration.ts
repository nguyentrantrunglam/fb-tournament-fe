export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
// Statuses an organizer may set via PATCH /registrations/:rid/status.
// 'withdrawn' is intentionally excluded — it has its own ownership-aware flow.
export type EditableStatus = 'pending' | 'approved' | 'rejected'
// Kept to match the backend list payload (still returns paymentStatus); no longer
// rendered in the registrations UI.
export type RegistrationPaymentStatus = 'paid' | 'unpaid'

// Slim row cho bảng quản lý đăng ký (BTC). CCCD/SĐT đã mask để không lộ PII.
export type RegistrationRow = {
  id: string
  athleteName: string
  cccdLast4: string   // 4 số cuối, vd "1234"
  phoneMasked: string // vd "0903…"
  partnerName: string | null // null nếu nội dung đơn
  categoryId: string
  categoryCode: string // MS / WS / MD / MX / OPEN
  fee: number          // feeSnapshot lúc đăng ký (VND)
  paymentStatus: RegistrationPaymentStatus
  registeredAt: string // ISO datetime
  status: RegistrationStatus
  seed: number | null
  teamPhotoUrl: string | null
}

// Option cho panel filter theo nội dung
export type CategoryFilterOption = {
  id: string
  code: string
  name: string
}
