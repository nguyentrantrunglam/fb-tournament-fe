// 1 "đội" = 1 registration (đơn: 1 VĐV, đôi: 2 VĐV). Dùng cho màn Danh sách đội:
// gán seed + upload ảnh đội → bốc thăm.
export type TeamPlayer = {
  name: string     // tên hiển thị ngắn, vd "Hùng"
  initials: string // viết tắt cho avatar, vd "LH"
}

export type TeamEntry = {
  id: string
  seed: number | null      // null = chưa gán seed (random lúc bốc thăm)
  players: TeamPlayer[]     // 1 đơn / 2 đôi
  clubName: string | null   // null → hiển thị "Indep."
  photoUploaded: boolean    // true → "ảnh tự upload"
}

export type CategoryDrawStatus = 'not_drawn' | 'drawn'

// Gói nội dung + danh sách đội của nó (1 tab)
export type CategoryTeams = {
  id: string
  code: string
  name: string
  playerCount: 1 | 2
  approvedCount: number
  seededCount: number
  drawStatus: CategoryDrawStatus
  bracketVersion: number | null // vd 1 → "bracket v1 active"
  teams: TeamEntry[]
}
