// Lịch là estimate: scheduledAt tính từ startAt + (matchIndex / courtCount) * estimatedMinPerMatch
// (xem bracket schedule spec / phase Operations Console). Soft, BTC điều chỉnh khi vận hành.
export type ScheduleMatchStatus = 'pending' | 'in_progress' | 'completed' | 'walkover'

// Sân KHÔNG gán ở trang Lịch — gán match→sân thực hiện ở Vận hành LIVE.
// Trang này quản lý THỨ TỰ trận (order) → quyết scheduledAt dự kiến.
export type ScheduleMatch = {
  id: string
  categoryCode: string // MS / MX …
  roundLabel: string   // R1 / QF / SF / F
  matchNo: string      // M07
  sideAName: string
  sideBName: string
  scheduledAt: string  // ISO datetime (dự kiến, tính theo thứ tự)
  status: ScheduleMatchStatus
}

export type CategoryScheduleConfig = {
  id: string
  code: string
  name: string
  matchCount: number          // số trận cần xếp (không tính bye)
  startAt: string             // ISO datetime-local
  estimatedMinPerMatch: number
}
