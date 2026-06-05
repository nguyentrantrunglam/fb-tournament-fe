export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
// Statuses an organizer may set via PATCH /registrations/:rid/status.
// 'withdrawn' is intentionally excluded — it has its own ownership-aware flow.
export type EditableStatus = 'pending' | 'approved' | 'rejected'
// Kept to match the backend list payload (still returns paymentStatus); no longer
// rendered in the registrations UI.
export type RegistrationPaymentStatus = 'paid' | 'unpaid'

// Slim row cho bảng quản lý đăng ký (BTC).
export type RegistrationRow = {
  id: string
  // Primary athlete
  athleteName: string
  athleteAvatarUrl: string | null
  athleteGender: 'male' | 'female' | null
  athleteDob: string | null         // ISO datetime
  athleteCccd: string | null        // full national ID (organizer view)
  athletePhone: string | null       // full phone (organizer view)
  // Partner (doubles only)
  partnerName: string | null
  partnerAvatarUrl: string | null
  partnerGender: 'male' | 'female' | null
  partnerDob: string | null
  partnerCccd: string | null
  partnerPhone: string | null
  // Registration
  categoryId: string
  categoryCode: string
  fee: number
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
