'use client'

import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { MatchSchedule } from './MatchSchedule'
import { ScheduleConfigForm } from './ScheduleConfigForm'
import type { ScheduleMatch, CategoryScheduleConfig } from '@/lib/types/schedule'

type Tab = 'schedule' | 'config'

const TABS: { key: Tab; label: string }[] = [
  { key: 'schedule', label: 'Lịch thi đấu' },
  { key: 'config', label: 'Cấu hình lịch' },
]

type Props = {
  configs: CategoryScheduleConfig[]
  matches: ScheduleMatch[]
  courtCount: number
}

export function ScheduleClient({ configs: initialConfigs, matches, courtCount }: Props) {
  const [tab, setTab] = useState<Tab>('schedule')
  const [configs, setConfigs] = useState(initialConfigs)
  const [order, setOrder] = useState(matches)

  // Đổi thứ tự trận — TODO: gọi CF reorderMatches → tính lại scheduledAt
  function handleReorder(from: number, to: number) {
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      if (moved) next.splice(to, 0, moved)
      return next
    })
  }

  function handleConfigChange(
    id: string,
    patch: Partial<Pick<CategoryScheduleConfig, 'startAt' | 'estimatedMinPerMatch'>>,
  ) {
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  // Nhập tỉ số thủ công (BTC override) — TODO: CF recordGameScore + endMatch
  function handleEnterScore(matchId: string, games: { a: number; b: number }[]) {
    const aWins = games.filter((g) => g.a > g.b).length
    const bWins = games.length - aWins
    setOrder((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: aWins !== bWins ? 'completed' : m.status } : m)),
    )
  }

  function handleRecompute() {
    // TODO: gọi CF setScheduleConfig cho từng nội dung → batch update matches.scheduledAt
  }

  const actions = (
    <>
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
        <Download className="w-3.5 h-3.5" />
        Xuất lịch
      </button>
      <button
        onClick={handleRecompute}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Tính lại lịch
      </button>
    </>
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Lịch & trận"
        description="Lịch dự kiến tính từ giờ bắt đầu + phút/trận + số sân. Theo dõi trận theo ngày & sân."
        actions={actions}
      />

      {/* Tabs (cố định cùng header) */}
      <div className="flex-shrink-0 px-8 border-b border-zinc-800">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body (scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {tab === 'schedule' ? (
          <MatchSchedule matches={order} onReorder={handleReorder} onEnterScore={handleEnterScore} />
        ) : (
          <ScheduleConfigForm configs={configs} courtCount={courtCount} onChange={handleConfigChange} />
        )}
      </div>
    </div>
  )
}
