'use client'

import { useState } from 'react'
import { Plus, Trophy, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ScheduleMatch } from '@/lib/types/schedule'

export type GameScore = { a: number; b: number }

const scoreInputCls = cn(
  'w-16 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-center text-[15px] font-semibold text-white tabular-nums',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: ScheduleMatch | null
  onSave: (matchId: string, games: GameScore[]) => void
}

export function ScoreEntryDialog({ open, onOpenChange, match, onSave }: Props) {
  const [games, setGames] = useState<GameScore[]>([{ a: 0, b: 0 }])

  // Reset khi mở dialog / đổi trận (adjust-state-during-render)
  const key = `${open}|${match?.id ?? ''}`
  const [prevKey, setPrevKey] = useState(key)
  if (key !== prevKey) {
    setPrevKey(key)
    setGames([{ a: 0, b: 0 }])
  }

  if (!match) return null

  const aWins = games.filter((g) => g.a > g.b).length
  const bWins = games.filter((g) => g.b > g.a).length
  const winner = aWins > bWins ? match.sideAName : bWins > aWins ? match.sideBName : null

  function setScore(i: number, side: 'a' | 'b', value: number) {
    setGames((prev) => prev.map((g, idx) => (idx === i ? { ...g, [side]: Math.max(0, value) } : g)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Nhập tỉ số thủ công</DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-zinc-500 -mt-1 font-mono">
          {match.categoryCode} · {match.roundLabel} · {match.matchNo}
        </p>

        {/* Tên 2 bên */}
        <div className="flex items-center justify-between gap-2 text-[13px] mt-1">
          <span className="flex-1 text-zinc-200 truncate">{match.sideAName}</span>
          <span className="text-zinc-600 text-[11px]">vs</span>
          <span className="flex-1 text-right text-zinc-200 truncate">{match.sideBName}</span>
        </div>

        {/* Các game */}
        <div className="space-y-2 mt-1">
          {games.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-14 text-[12px] text-zinc-500 flex-shrink-0">Game {i + 1}</span>
              <input
                type="number"
                min={0}
                value={g.a}
                onChange={(e) => setScore(i, 'a', Number(e.target.value) || 0)}
                className={scoreInputCls}
              />
              <span className="text-zinc-600">—</span>
              <input
                type="number"
                min={0}
                value={g.b}
                onChange={(e) => setScore(i, 'b', Number(e.target.value) || 0)}
                className={scoreInputCls}
              />
              {games.length > 1 && (
                <button
                  onClick={() => setGames((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-auto p-1 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setGames((prev) => [...prev, { a: 0, b: 0 }])}
          className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm game
        </button>

        {/* Winner preview */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-[13px]',
            winner ? 'bg-emerald-950/40 text-emerald-300' : 'bg-zinc-800/60 text-zinc-500',
          )}
        >
          <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
          {winner ? (
            <span>
              Thắng: <span className="font-semibold">{winner}</span> ({aWins}–{bWins} game)
            </span>
          ) : (
            <span>Chưa đủ điểm xác định người thắng</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={() => {
              onSave(match.id, games)
              onOpenChange(false)
            }}
            disabled={!winner}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              winner ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
            )}
          >
            Lưu tỉ số
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
