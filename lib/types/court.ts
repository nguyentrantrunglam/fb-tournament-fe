// idle      = sân trống, chưa có trận
// preparing = đã có trận gán vào nhưng chưa bắt đầu
// in_use    = đang chạy 1 trận (in_progress)
export type CourtStatus = 'idle' | 'preparing' | 'in_use'

// Snapshot trận hiển thị trên court card. Gán match→court thực hiện ở Vận hành LIVE;
// màn này chỉ đọc trạng thái + cho phép "Bắt đầu" trận đã chuẩn bị.
export type CourtMatchPreview = {
  matchId: string
  categoryCode: string // vd "MS"
  roundLabel: string   // vd "R1"
  matchNo: string      // vd "M07"
  sideAName: string
  sideBName: string
  // chỉ có khi status = in_use
  gameLabel: string | null // vd "Game 3"
  scoreA: number | null
  scoreB: number | null
}

// Trọng tài chọn được cho picker (subset role=referee của giải)
export type RefereeOption = {
  uid: string
  name: string
  tag: string // viết tắt hiển thị, vd "ĐS"
}

export type CourtWithState = {
  id: string
  tournamentId: string
  name: string  // "Sân 1"
  order: number // 1
  status: CourtStatus
  currentRefereeUid: string | null
  match: CourtMatchPreview | null
}
