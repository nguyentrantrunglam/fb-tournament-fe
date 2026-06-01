// online = có mặt + đang gán ≥1 sân
// available = có mặt + chưa gán sân nào
// offline = không có mặt
export type RefereeStatus = 'online' | 'available' | 'offline'

export type RefereeWithStats = {
  uid: string
  tournamentId: string
  displayName: string
  phone: string            // hiển thị (không phải CCCD)
  avatarUrl: string | null
  status: RefereeStatus
  assignedCourts: string[] // tên sân, vd ['Sân 1', 'Sân 2']
  matchesTodayCount: number
  lastSeenLabel: string | null  // pre-formatted vd "hôm qua 18:42"
}
