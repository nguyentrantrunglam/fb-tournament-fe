'use client'

import { useMemo, useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { CourtCard } from './CourtCard'
import { AddCourtDialog } from './AddCourtDialog'
import type { CourtWithState, RefereeOption } from '@/lib/types/court'

type Props = {
  courts: CourtWithState[]
  referees: RefereeOption[]
  tournamentId: string
}

export function CourtBoard({ courts: initialCourts, referees, tournamentId }: Props) {
  const [courts, setCourts] = useState<CourtWithState[]>(initialCourts)
  const [addOpen, setAddOpen] = useState(false)

  // Trọng tài dùng cho ≥2 sân → cảnh báo trên các sân liên quan.
  // Map courtId → tên sân khác chia sẻ cùng trọng tài (null nếu không trùng).
  const conflictByCourt = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const c of courts) {
      const other = c.currentRefereeUid
        ? courts.find((x) => x.id !== c.id && x.currentRefereeUid === c.currentRefereeUid)
        : undefined
      map[c.id] = other ? other.name : null
    }
    return map
  }, [courts])

  function handleAssignReferee(courtId: string, uid: string | null) {
    // TODO: gọi CF assignRefereeToCourt(courtId, uid)
    setCourts((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, currentRefereeUid: uid } : c)),
    )
  }

  function handleStartMatch(courtId: string) {
    // TODO: gọi CF startMatch(match.matchId) — đổi court sang in_use
    setCourts((prev) =>
      prev.map((c) =>
        c.id === courtId && c.match
          ? { ...c, status: 'in_use', match: { ...c.match, gameLabel: 'Game 1', scoreA: 0, scoreB: 0 } }
          : c,
      ),
    )
  }

  function handleOpenMatch(matchId: string) {
    // Trận đang chạy → trang chấm điểm trọng tài
    window.location.href = `/tournaments/${tournamentId}/live?match=${matchId}`
  }

  function handleAddCourt(name: string) {
    const order = courts.length + 1
    setCourts((prev) => [
      ...prev,
      {
        id: `court-new-${order}`,
        tournamentId,
        name,
        order,
        status: 'idle',
        currentRefereeUid: null,
        match: null,
      },
    ])
  }

  const total = courts.length
  const suggestedName = `Sân ${total + 1}`
  const description =
    total === 0
      ? 'Chưa có sân nào. Thêm sân để bắt đầu vận hành.'
      : `${total} sân · gán trọng tài cố định, sau đó kéo match vào sân ở Vận hành LIVE.`

  return (
    <div className="px-8 py-7">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-white leading-tight">Sân thi đấu</h1>
          <p className="text-[13px] text-zinc-400 mt-1">{description}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm sân
        </button>
      </div>

      {/* ── Court grid / empty state ── */}
      {total === 0 ? (
        <button
          onClick={() => setAddOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 hover:border-zinc-500 py-20 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <MapPin className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">
              Thêm sân đầu tiên
            </p>
            <p className="text-[12px] text-zinc-600 mt-0.5">
              Vd: Sân 1, Sân 2, Sân 3
            </p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              referees={referees}
              conflictCourtName={conflictByCourt[court.id] ?? null}
              onAssignReferee={handleAssignReferee}
              onStartMatch={handleStartMatch}
              onOpenMatch={handleOpenMatch}
            />
          ))}
        </div>
      )}

      {/* ── Add court dialog ── */}
      <AddCourtDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        suggestedName={suggestedName}
        onAdd={handleAddCourt}
      />
    </div>
  )
}
