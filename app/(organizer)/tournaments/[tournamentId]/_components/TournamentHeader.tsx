'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tournament, TournamentStatus } from '@/lib/types/tournament'

// Các bước lifecycle — thứ tự tương ứng với status field
const STEPS: Array<{ label: string; reachedAt: TournamentStatus[] }> = [
  { label: 'Cấu hình',    reachedAt: ['draft', 'open', 'running', 'completed', 'cancelled'] },
  { label: 'Mở đăng ký',  reachedAt: ['open', 'running', 'completed', 'cancelled'] },
  { label: 'Bốc thăm',    reachedAt: ['running', 'completed', 'cancelled'] },
  { label: 'Sẵn sàng',    reachedAt: ['running', 'completed'] },
  { label: 'Vận hành',    reachedAt: ['running', 'completed'] },
  { label: 'Kết thúc',    reachedAt: ['completed'] },
]

// Step active = bước cuối cùng đã đạt được
const ACTIVE_STEP: Record<TournamentStatus, number> = {
  draft: 0,
  open: 1,
  running: 4, // step index 4 = Vận hành
  completed: 5,
  cancelled: 5,
}

const PAGE_LABELS: Record<string, string> = {
  'tournament-info':    'Thông tin giải',
  content:              'Nội dung',
  referees:             'Trọng tài',
  courts:               'Sân thi đấu',
  fees:                 'Lệ phí & QR',
  registrations:        'Đăng ký',
  teams:                'Danh sách đội',
  bracket:              'Sơ đồ',
  'semifinals-config':  'Cấu hình bán kết',
  schedule:             'Lịch & trận',
  live:                 'Vận hành LIVE',
}

export function TournamentHeader({
  tournamentId,
  tournament,
}: {
  tournamentId: string
  tournament: Tournament
}) {
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).at(-1) ?? ''
  const pageLabel = PAGE_LABELS[lastSegment] ?? tournament.name

  const activeIdx = ACTIVE_STEP[tournament.status]

  return (
    <header className="h-14 flex items-center gap-4 px-5 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-shrink-0 min-w-0 max-w-[200px]">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="text-zinc-400 hover:text-white transition-colors truncate"
        >
          {tournament.name}
        </Link>
        <span className="text-zinc-700 flex-shrink-0">›</span>
        <span className="text-white font-medium whitespace-nowrap">{pageLabel}</span>
      </div>

      {/* Stepper — scrollable trên màn nhỏ */}
      <div
        className="flex-1 flex items-center justify-center gap-0 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {STEPS.map((step, idx) => {
          const isDone   = idx < activeIdx
          const isActive = idx === activeIdx
          const isPending = idx > activeIdx

          return (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 text-[12px] whitespace-nowrap',
                  isDone   && 'text-zinc-400',
                  isActive && 'text-orange-400 font-semibold',
                  isPending && 'text-zinc-600',
                )}
              >
                {isDone ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                      isActive  ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'
                    )}
                  >
                    {idx + 1}
                  </span>
                )}
                {step.label}
              </div>
              {idx < STEPS.length - 1 && (
                <span className="text-zinc-700 text-[10px] flex-shrink-0 mx-0.5 select-none">—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="relative p-1.5 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-white select-none">
          PH
        </div>
      </div>
    </header>
  )
}
