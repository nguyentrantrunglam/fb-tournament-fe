'use client'

import { KnockoutBracket } from './KnockoutBracket'
import { StandingsTable } from './StandingsTable'
import type { GroupKoView as GKView } from '@/lib/types/bracket'

export function GroupKoView({ data }: { data: GKView }) {
  return (
    <div className="space-y-8">
      {/* Vòng bảng */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Vòng bảng · {data.groups.length} bảng
          </p>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full">
            Top {data.qualifyPerGroup} mỗi bảng đi tiếp
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.groups.map((g) => (
            <div key={g.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[13px] font-semibold text-white mb-2">{g.name}</p>
              <StandingsTable rows={g.standings} qualifyMark />
            </div>
          ))}
        </div>
      </div>

      {/* Vòng trong (playoff) */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Vòng trong · đội qua bảng
        </p>
        <KnockoutBracket rounds={data.knockout} />
      </div>
    </div>
  )
}
