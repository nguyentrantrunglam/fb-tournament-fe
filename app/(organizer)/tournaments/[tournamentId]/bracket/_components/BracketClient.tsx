'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { BracketCategoryPanel } from './bracket-category-panel'
import type { CategoryWithStats } from '@/lib/types/category'

type Props = {
  categories: CategoryWithStats[]
}

export function BracketClient({ categories }: Props) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const active = categories.find((c) => c.id === activeId) ?? categories[0]

  if (!categories.length) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Sơ đồ thi đấu"
          description="Bốc thăm và quản lý sơ đồ thi đấu theo từng hạng mục."
        />
        <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
          Chưa có hạng mục thi đấu nào.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Sơ đồ thi đấu"
        description="Bốc thăm và quản lý sơ đồ thi đấu theo từng hạng mục."
      />

      <div className="flex-1 min-h-0 flex flex-col px-8 py-2">
        {/* Category tabs */}
        <div
          className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto shrink-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
                c.id === activeId
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              <span className="font-mono text-zinc-500">{c.code}</span>
              {' · '}
              {c.name}
            </button>
          ))}
        </div>

        {/* Per-category state machine panel */}
        <div className="flex-1 min-h-0 mt-6 pb-6 overflow-y-auto">
          {active && <BracketCategoryPanel key={active.id} category={active} />}
        </div>
      </div>
    </div>
  )
}
