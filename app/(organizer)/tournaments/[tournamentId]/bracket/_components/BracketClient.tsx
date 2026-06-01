'use client'

import { useState } from 'react'
import { History, Shuffle, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { KnockoutBracket } from './KnockoutBracket'
import { RoundRobinView } from './RoundRobinView'
import { GroupKoView } from './GroupKoView'
import type { CategoryBracket, BracketMeta } from '@/lib/types/bracket'

function MetaBar({ meta }: { meta: BracketMeta }) {
  const cells: { label: string; value: React.ReactNode }[] = [
    { label: 'Mode', value: meta.mode },
    { label: 'Bracket size', value: meta.bracketSize ?? '—' },
    { label: 'Bye', value: meta.byes },
    { label: 'Rounds', value: meta.roundsLabel },
    {
      label: 'Active version',
      value: (
        <span className="flex items-center gap-1.5">
          {meta.activeVersion}
          {meta.isLive && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              <Check className="w-3 h-3" /> live
            </span>
          )}
        </span>
      ),
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      {cells.map((c) => (
        <div key={c.label}>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{c.label}</p>
          <p className="text-[14px] text-white mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

export function BracketClient({ categories }: { categories: CategoryBracket[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const active = categories.find((c) => c.id === activeId) ?? categories[0]
  if (!active) return null

  const actions = (
    <>
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
        <History className="w-3.5 h-3.5" />
        Lịch sử ({active.meta.versionsCount} versions)
      </button>
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
        <Shuffle className="w-3.5 h-3.5" />
        Re-arrange R1
      </button>
      <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors">
        <RotateCcw className="w-4 h-4" />
        Bốc lại
      </button>
    </>
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Sơ đồ thi đấu"
        description="Bốc thăm, re-arrange và quản lý phiên bản. Lưu lịch sử mọi phiên bản."
        actions={actions}
      />

      <div className="flex-1 min-h-0 flex flex-col px-8 py-2">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
                c.id === activeId ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              <span className="font-mono text-zinc-500">{c.code}</span> · {c.countLabel}
            </button>
          ))}
        </div>

        <div className="mt-5 flex-shrink-0">
          <MetaBar meta={active.meta} />
        </div>

        {/* Vùng sơ đồ — fill chiều cao còn lại, tối thiểu nửa màn (KnockoutBracket: h-full min-h-[50vh]) */}
        <div className="flex-1 min-h-0 mt-6 pb-6 overflow-y-auto">
          {active.format === 'single_elim' && active.knockout && <KnockoutBracket rounds={active.knockout} />}
          {active.format === 'round_robin' && active.roundRobin && <RoundRobinView data={active.roundRobin} />}
          {active.format === 'group_ko' && active.groupKo && <GroupKoView data={active.groupKo} />}
        </div>
      </div>
    </div>
  )
}
