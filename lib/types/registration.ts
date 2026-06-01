export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
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
}

// Option cho panel filter theo nội dung
export type CategoryFilterOption = {
  id: string
  code: string
  name: string
}
