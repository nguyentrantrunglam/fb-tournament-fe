// 1 "đội" = 1 registration (đơn: 1 VĐV, đôi: 2 VĐV). Dùng cho màn Danh sách đội:
// gán seed + upload ảnh đội.
export type TeamPlayer = {
  name: string     // tên hiển thị ngắn, vd "Hùng"
  initials: string // viết tắt cho avatar, vd "LH" — tính từ first+last word
}

export type TeamEntry = {
  id: string
  seed: number | null      // null = chưa gán seed
  players: TeamPlayer[]    // 1 đơn / 2 đôi
  teamPhotoUrl: string | null
}

// Gói nội dung + danh sách đội của nó (1 tab)
export type CategoryTeams = {
  id: string
  code: string
  name: string
  playerCount: 1 | 2
  approvedCount: number
  seededCount: number
  teams: TeamEntry[]
}
