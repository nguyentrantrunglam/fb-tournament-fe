'use client'

import { cn } from '@/lib/utils'
import { StandingsTable } from './StandingsTable'
import type { RoundRobinView as RRView, BracketMatch } from '@/lib/types/bracket'

function MatchLine({ m }: { m: BracketMatch }) {
  const live = m.state === 'live'
  const done = m.state === 'completed'
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border bg-zinc-900 text-[12px]',
        live ? 'border-red-500/50' : 'border-zinc-800',
      )}
    >
      <span className="font-mono text-[10px] text-zinc-600 w-12 flex-shrink-0">{m.code}</span>
      <span className={cn('flex-1 text-right break-words', done && m.sideA.isWinner ? 'text-white font-medium' : 'text-zinc-300')}>
        {m.sideA.name}
      </span>
      <span className="tabular-nums text-zinc-400 w-10 text-center flex-shrink-0">
        {m.sideA.score ?? '–'}<span className="text-zinc-700">:</span>{m.sideB?.score ?? '–'}
      </span>
      <span className={cn('flex-1 break-words', done && m.sideB?.isWinner ? 'text-white font-medium' : 'text-zinc-300')}>
        {m.sideB?.name}
      </span>
      {live && <span className="text-[10px] text-red-400 flex-shrink-0">● LIVE</span>}
    </div>
  )
}

export function RoundRobinView({ data }: { data: RRView }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Bảng xếp hạng */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-[13px] font-semibold text-white mb-2">Bảng xếp hạng · vòng tròn 1 lượt</p>
        <StandingsTable rows={data.standings} />
      </div>

      {/* Danh sách trận */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Các trận · {data.matches.length}
        </p>
        <div className="flex flex-col gap-2">
          {data.matches.map((m) => (
            <MatchLine key={m.id} m={m} />
          ))}
        </div>
      </div>
    </div>
  )
}
