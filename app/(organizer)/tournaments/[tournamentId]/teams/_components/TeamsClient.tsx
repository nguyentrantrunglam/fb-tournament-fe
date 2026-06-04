'use client'

import { useCallback, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { TeamCard } from './TeamCard'
import { useTeams, useTeamsRealtime } from '@/lib/teams/queries'

const PAGE_SIZE = 8

export function TeamsClient({ tournamentId }: { tournamentId: string }) {
  const { data: categories = [], isLoading } = useTeams(tournamentId)
  useTeamsRealtime(tournamentId)

  const [activeId, setActiveId] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Derive the resolved active category (last tab by default once data loads)
  const resolvedActiveId = activeId || categories.at(-1)?.id || categories[0]?.id || ''

  // Reset pagination when switching tabs (adjust-state-during-render pattern)
  const [prevActiveId, setPrevActiveId] = useState(resolvedActiveId)
  if (prevActiveId !== resolvedActiveId) {
    setPrevActiveId(resolvedActiveId)
    setVisibleCount(PAGE_SIZE)
  }

  const active = useMemo(
    () => categories.find((c) => c.id === resolvedActiveId) ?? categories[0],
    [categories, resolvedActiveId],
  )

  const loadMore = useCallback(() => setVisibleCount((v) => v + PAGE_SIZE), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đội…
      </div>
    )
  }

  if (!active) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Danh sách đội"
          description="Danh sách đội đã duyệt · gán seed & ảnh đội cho từng đội"
        />
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-zinc-800 mx-8 text-[13px] text-zinc-600">
          Chưa có nội dung nào hoặc chưa có đội approved.
        </div>
      </div>
    )
  }

  const unit = active.playerCount === 1 ? 'VĐV' : 'cặp'
  const visible = active.teams.slice(0, visibleCount)
  const hasMore = visibleCount < active.teams.length

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Danh sách đội"
        description="Danh sách đội đã duyệt · gán seed & ảnh đội cho từng đội"
      />

      {/* Category tabs */}
      <div className="shrink-0 px-8">
        <div
          className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
                c.id === resolvedActiveId
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              <span className="font-mono text-zinc-500">{c.code}</span>
              · {c.name}
              <span className="text-[11px] tabular-nums text-zinc-500">{c.approvedCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-6 pt-5">
        {/* Status bar */}
        <div className="flex items-center gap-3 mt-5 px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[12px] font-bold text-zinc-300 flex-shrink-0">
            {active.code}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white">
              {active.name} · {active.approvedCount} {unit} đã approved
            </p>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {active.seededCount} {unit} đã có seed
            </p>
          </div>
        </div>

        {/* Team grid */}
        {active.teams.length === 0 ? (
          <div className="mt-6 flex items-center justify-center h-40 rounded-xl border border-dashed border-zinc-800 text-[13px] text-zinc-600">
            Chưa có đội nào approved cho nội dung này.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
              {visible.map((team) => (
                <TeamCard key={team.id} team={team} tournamentId={tournamentId} />
              ))}
            </div>

            <InfiniteScrollSentinel
              hasMore={hasMore}
              onLoadMore={loadMore}
              label={`Đang tải thêm ${unit}…`}
            />
          </>
        )}
      </div>
    </div>
  )
}
