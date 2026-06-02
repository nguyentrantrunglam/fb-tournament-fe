'use client'

import { Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryScheduleConfig } from '@/lib/types/schedule'

const inputCls = cn(
  'bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-[13px] text-white',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
)

// rounds = số lượt chạy song song trên các sân; end = start + rounds * minPerMatch
function computeEnd(cfg: CategoryScheduleConfig, courtCount: number) {
  const rounds = courtCount > 0 ? Math.ceil(cfg.matchCount / courtCount) : cfg.matchCount
  const spanMin = rounds * cfg.estimatedMinPerMatch
  const end = new Date(new Date(cfg.startAt).getTime() + spanMin * 60000)
  const hh = end.getHours().toString().padStart(2, '0')
  const mi = end.getMinutes().toString().padStart(2, '0')
  const dd = end.getDate().toString().padStart(2, '0')
  const mm = (end.getMonth() + 1).toString().padStart(2, '0')
  return { rounds, spanMin, label: `${hh}:${mi} · ${dd}.${mm}` }
}

type Props = {
  configs: CategoryScheduleConfig[]
  courtCount: number
  onChange: (id: string, patch: Partial<Pick<CategoryScheduleConfig, 'startAt' | 'estimatedMinPerMatch'>>) => void
}

export function ScheduleConfigForm({ configs, courtCount, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Cấu hình lịch theo nội dung</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Giờ bắt đầu + phút/trận → tính giờ dự kiến từng trận. Lịch là ước tính, BTC điều chỉnh khi vận hành.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-md flex-shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          {courtCount} sân
        </span>
      </div>

      {/* Header cols */}
      <div className="hidden md:grid grid-cols-[1.4fr_0.6fr_1fr_0.8fr_1fr] gap-3 px-5 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider border-b border-zinc-800">
        <span>Nội dung</span>
        <span className="text-right">Số trận</span>
        <span>Bắt đầu</span>
        <span className="text-right">Phút/trận</span>
        <span className="text-right">Dự kiến kết thúc</span>
      </div>

      {configs.map((cfg) => {
        const end = computeEnd(cfg, courtCount)
        return (
          <div
            key={cfg.id}
            className="grid grid-cols-2 md:grid-cols-[1.4fr_0.6fr_1fr_0.8fr_1fr] gap-3 px-5 py-3 border-b border-zinc-800 last:border-b-0 items-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500">{cfg.code}</span>
              <span className="text-[13px] text-white truncate">{cfg.name}</span>
            </div>
            <span className="text-right text-[13px] text-zinc-400 tabular-nums">{cfg.matchCount}</span>
            <input
              type="datetime-local"
              value={cfg.startAt}
              onChange={(e) => onChange(cfg.id, { startAt: e.target.value })}
              className={inputCls}
            />
            <input
              type="number"
              min={5}
              step={5}
              value={cfg.estimatedMinPerMatch}
              onChange={(e) => onChange(cfg.id, { estimatedMinPerMatch: Math.max(5, Number(e.target.value) || 5) })}
              className={cn(inputCls, 'text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none')}
            />
            <span className="flex items-center justify-end gap-1.5 text-[13px] text-zinc-300 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              {end.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
