'use client'

import { useState } from 'react'
import { GripVertical, ChevronUp, ChevronDown, PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreEntryDialog, type GameScore } from './ScoreEntryDialog'
import type { ScheduleMatch, ScheduleMatchStatus } from '@/lib/types/schedule'

const STATUS: Record<ScheduleMatchStatus, { label: string; cls: string; dot: string }> = {
  pending:     { label: 'Chờ',  cls: 'text-zinc-400 bg-zinc-800',       dot: 'bg-zinc-500' },
  in_progress: { label: 'LIVE', cls: 'text-red-300 bg-red-950',         dot: 'bg-red-500' },
  completed:   { label: 'Xong', cls: 'text-emerald-300 bg-emerald-950', dot: 'bg-emerald-500' },
  walkover:    { label: 'W.O.', cls: 'text-amber-300 bg-amber-950',     dot: 'bg-amber-500' },
}

function whenLabel(iso: string): string {
  const [, mmdd] = iso.split('T')
  const date = iso.slice(5, 10).replace('-', '.')
  return `${mmdd?.slice(0, 5)} · ${date}`
}

type Props = {
  matches: ScheduleMatch[]
  onReorder: (from: number, to: number) => void
  onEnterScore: (matchId: string, games: GameScore[]) => void
}

export function MatchSchedule({ matches, onReorder, onEnterScore }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [scoreMatch, setScoreMatch] = useState<ScheduleMatch | null>(null)

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-zinc-800 text-[13px] text-zinc-600">
        Chưa có lịch — cấu hình giờ bắt đầu ở tab Cấu hình lịch.
      </div>
    )
  }

  function handleDrop(to: number) {
    if (dragIndex !== null && dragIndex !== to) onReorder(dragIndex, to)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <>
      <p className="text-[12px] text-zinc-500 mb-3">
        Kéo để đổi thứ tự thi đấu. Giờ dự kiến tính lại theo thứ tự khi lưu. Phân sân ở Vận hành LIVE.
      </p>

      <div className="flex flex-col gap-1.5">
        {matches.map((m, i) => {
          const s = STATUS[m.status]
          const live = m.status === 'in_progress'
          const locked = m.status === 'completed' || m.status === 'in_progress'
          return (
            <div
              key={m.id}
              draggable={!locked}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault()
                setOverIndex(i)
              }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-zinc-900 transition-colors',
                live ? 'border-red-500/50' : 'border-zinc-800',
                dragIndex === i && 'opacity-40',
                overIndex === i && dragIndex !== null && dragIndex !== i && 'border-orange-500/70',
              )}
            >
              {/* Drag handle */}
              <span className={cn('flex-shrink-0', locked ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-600 cursor-grab active:cursor-grabbing')}>
                <GripVertical className="w-4 h-4" />
              </span>

              {/* Số thứ tự */}
              <span className="w-6 flex-shrink-0 text-center text-[13px] font-semibold text-zinc-300 tabular-nums">
                {i + 1}
              </span>

              {/* Giờ dự kiến */}
              <span className="w-24 flex-shrink-0 text-[12px] text-zinc-500 tabular-nums">{whenLabel(m.scheduledAt)}</span>

              {/* Mã trận */}
              <span className="w-28 flex-shrink-0 font-mono text-[11px] text-zinc-500">
                {m.categoryCode} · {m.roundLabel} · {m.matchNo}
              </span>

              {/* Cặp đấu */}
              <div className="flex-1 min-w-0 text-[13px] text-zinc-200 truncate">
                {m.sideAName} <span className="text-zinc-600">vs</span> {m.sideBName}
              </div>

              {/* Trạng thái */}
              <span className={cn('flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full', s.cls)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', s.dot, live && 'animate-pulse')} />
                {s.label}
              </span>

              {/* Nhập tỉ số thủ công (trận chưa xong) */}
              {(m.status === 'pending' || m.status === 'in_progress') && (
                <button
                  onClick={() => setScoreMatch(m)}
                  className="flex-shrink-0 flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-2 py-1 transition-colors"
                >
                  <PencilLine className="w-3 h-3" />
                  Tỉ số
                </button>
              )}

              {/* Up / Down */}
              <div className="flex flex-col flex-shrink-0">
                <button
                  onClick={() => i > 0 && onReorder(i, i - 1)}
                  disabled={i === 0 || locked}
                  className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-600 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => i < matches.length - 1 && onReorder(i, i + 1)}
                  disabled={i === matches.length - 1 || locked}
                  className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-600 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ScoreEntryDialog
        open={scoreMatch !== null}
        onOpenChange={(o) => !o && setScoreMatch(null)}
        match={scoreMatch}
        onSave={onEnterScore}
      />
    </>
  )
}
