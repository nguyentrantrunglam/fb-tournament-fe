'use client'

import { cn } from '@/lib/utils'
import type { StandingRow } from '@/lib/types/bracket'

const COLS = [
  { key: 'rank', label: '#', align: 'left' },
  { key: 'name', label: 'VĐV / Đội', align: 'left' },
  { key: 'played', label: 'TR', align: 'right' },
  { key: 'won', label: 'T', align: 'right' },
  { key: 'lost', label: 'B', align: 'right' },
  { key: 'gameDiff', label: '+/-', align: 'right' },
  { key: 'points', label: 'Điểm', align: 'right' },
] as const

export function StandingsTable({
  rows,
  qualifyMark = false,
}: {
  rows: StandingRow[]
  qualifyMark?: boolean // tô đậm các dòng qualified (group_ko)
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800">
          {COLS.map((c) => (
            <th
              key={c.key}
              className={cn(
                'py-2 px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider',
                c.align === 'right' ? 'text-right' : 'text-left',
              )}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.rank}
            className={cn(
              'border-b border-zinc-800/60',
              qualifyMark && r.qualified && 'bg-emerald-950/20',
            )}
          >
            <td className="py-2 px-2">
              <span
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold tabular-nums',
                  qualifyMark && r.qualified ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500',
                )}
              >
                {r.rank}
              </span>
            </td>
            <td className="py-2 px-2">
              <span className="text-[13px] text-white">
                {r.seed !== null && <span className="text-[11px] text-zinc-600 mr-1.5">[{r.seed}]</span>}
                {r.name}
              </span>
            </td>
            <td className="py-2 px-2 text-right text-[12px] text-zinc-400 tabular-nums">{r.played}</td>
            <td className="py-2 px-2 text-right text-[12px] text-emerald-400 tabular-nums">{r.won}</td>
            <td className="py-2 px-2 text-right text-[12px] text-zinc-500 tabular-nums">{r.lost}</td>
            <td className="py-2 px-2 text-right text-[12px] text-zinc-400 tabular-nums">
              {r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}
            </td>
            <td className="py-2 px-2 text-right text-[13px] font-semibold text-white tabular-nums">{r.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
