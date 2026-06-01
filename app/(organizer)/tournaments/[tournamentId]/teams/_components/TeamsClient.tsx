'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download, Shuffle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { TeamCard } from './TeamCard'
import type { CategoryTeams } from '@/lib/types/team'

const PAGE_SIZE = 8

export function TeamsClient({ categories }: { categories: CategoryTeams[] }) {
  const [activeId, setActiveId] = useState(categories.at(-1)?.id ?? categories[0]?.id ?? '')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset về trang đầu khi đổi tab nội dung (adjust-state-during-render)
  const [prevActiveId, setPrevActiveId] = useState(activeId)
  if (prevActiveId !== activeId) {
    setPrevActiveId(activeId)
    setVisibleCount(PAGE_SIZE)
  }

  const active = useMemo(
    () => categories.find((c) => c.id === activeId) ?? categories[0],
    [categories, activeId],
  )
  const loadMore = useCallback(() => setVisibleCount((v) => v + PAGE_SIZE), [])

  if (!active) return null

  const unit = active.playerCount === 1 ? 'VĐV' : 'cặp'
  const unseeded = Math.max(0, active.approvedCount - active.seededCount)
  const visible = active.teams.slice(0, visibleCount)
  const hasMore = visibleCount < active.teams.length
  const isDrawn = active.drawStatus === 'drawn'

  function handleDraw() {
    // TODO: gọi CF drawBracket(categoryId)
  }
  function handleRedraw() {
    // TODO: gọi CF redrawBracket(categoryId) — confirm trước (xoá bracket cũ)
  }
  function handleUpload(teamId: string) {
    // TODO: upload ảnh đội → Firebase Storage + set registration.teamPhotoUrl
    void teamId
  }

  const actions = (
    <>
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
        <Download className="w-3.5 h-3.5" />
        Xuất danh sách
      </button>
      <button
        onClick={handleDraw}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Shuffle className="w-4 h-4" />
        Bốc thăm hạng mục này
      </button>
    </>
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Danh sách đội"
        description="Sau khi đóng đăng ký, gán seed và upload ảnh đội cho công bố public. Bốc thăm khi sẵn sàng."
        actions={actions}
      />

      {/* Category tabs (cố định cùng header) */}
      <div className="flex-shrink-0 px-8">
        <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
              {active.seededCount} {unit} đã gán seed · còn {unseeded} {unit} unseeded → sẽ random ở bốc thăm
            </p>
          </div>

          {isDrawn && (
            <>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đã bốc · bracket v{active.bracketVersion} active
              </span>
              <button
                onClick={handleRedraw}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-zinc-300 border border-zinc-700 hover:text-white hover:border-zinc-500 rounded-md transition-colors flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Bốc lại
              </button>
            </>
          )}
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
                <TeamCard key={team.id} team={team} onUpload={handleUpload} />
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
