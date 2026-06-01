'use client'

import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BracketMatch, MatchSide } from '@/lib/types/bracket'

function SideRow({
  side,
  state,
}: {
  side: MatchSide
  state: BracketMatch['state']
}) {
  const isPlaceholder = side.name === null
  const isLoser = state === 'completed' && !side.isWinner
  const isWinner = state === 'completed' && side.isWinner
  // Đôi: "Tên A / Tên B" → xuống dòng từng VĐV để hiển thị đầy đủ
  const names = side.name ? side.name.split(' / ') : []

  return (
    <div className="flex items-start gap-2 px-3 py-2">
      <span className="w-4 text-[11px] tabular-nums text-zinc-600 flex-shrink-0 text-center pt-0.5">
        {side.seed ?? ''}
      </span>
      <div
        className={cn(
          'flex-1 min-w-0 text-[13px] leading-tight',
          isPlaceholder && 'italic text-zinc-500',
          isLoser && 'line-through text-zinc-600',
          isWinner ? 'text-white font-semibold' : !isPlaceholder && 'text-zinc-200',
        )}
      >
        {isPlaceholder
          ? side.placeholder
          : names.map((n, i) => (
              <span key={i} className="block break-words">
                {n}
              </span>
            ))}
      </div>
      <span
        className={cn(
          'text-[13px] tabular-nums flex-shrink-0 pt-0.5',
          side.score === null ? 'text-zinc-600' : isWinner ? 'text-white font-semibold' : 'text-zinc-400',
        )}
      >
        {side.score ?? '—'}
      </span>
    </div>
  )
}

export function BracketMatchCard({ match, final = false }: { match: BracketMatch; final?: boolean }) {
  const live = match.state === 'live'
  const bye = match.sideB === null

  return (
    <div
      className={cn(
        'rounded-lg border bg-zinc-900 overflow-hidden w-full',
        live ? 'border-red-500/60' : final ? 'border-orange-500/60' : 'border-zinc-800',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border-b',
          live ? 'text-red-400 border-zinc-800' : final ? 'text-orange-400 border-zinc-800' : 'text-zinc-500 border-zinc-800/70',
        )}
      >
        {live && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
        {final && <Trophy className="w-3 h-3" />}
        {live ? `LIVE ${match.liveCourt ?? ''}` : final ? 'CHUNG KẾT' : `${match.code}${bye ? ' BYE' : ''}`}
      </div>

      {/* Sides */}
      {bye ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="w-4 text-[11px] tabular-nums text-zinc-600 flex-shrink-0 text-center">
              {match.sideA.seed ?? ''}
            </span>
            <span className="flex-1 min-w-0 text-[13px] text-zinc-200 break-words">{match.sideA.name}</span>
            <span className="text-[11px] text-emerald-400 flex-shrink-0">tự thắng</span>
          </div>
          <div className="border-t border-zinc-800/70" />
          <div className="flex items-center px-3 py-2 text-[12px] text-zinc-600 italic">BYE</div>
        </>
      ) : (
        <>
          <SideRow side={match.sideA} state={match.state} />
          <div className="border-t border-zinc-800/70" />
          <SideRow side={match.sideB!} state={match.state} />
        </>
      )}
    </div>
  )
}
