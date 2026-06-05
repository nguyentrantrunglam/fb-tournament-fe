// 1 "đội" = 1 registration (đơn: 1 VĐV, đôi: 2 VĐV). Dùng cho màn Danh sách đội:
// gán seed + upload ảnh đội.
export type TeamPlayer = {
  name: string
  initials: string
  gender: 'male' | 'female' | null
  dob: string | null    // ISO datetime
  cccd: string | null   // full national ID (organizer view)
  phone: string | null  // full phone (organizer view)
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
