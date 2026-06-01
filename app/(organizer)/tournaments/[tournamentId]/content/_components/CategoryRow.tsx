'use client'

import { User, Users, GitFork, CalendarDays, DollarSign, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryWithStats, GenderRequirement } from '@/lib/types/category'

// ─── Avatar color per gender ──────────────────────────────────────────────────

const AVATAR_STYLE: Record<GenderRequirement, string> = {
  men_only:     'bg-sky-900 text-sky-200',
  women_only:   'bg-rose-900 text-rose-200',
  mixed_pair:   'bg-violet-900 text-violet-200',
  unrestricted: 'bg-zinc-700 text-zinc-300',
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeCfg = { label: string; dot: string; cls: string }

function getStatusBadge(cat: CategoryWithStats): BadgeCfg {
  if (cat.registrationStatus === 'not_open')
    return { label: 'Chưa mở', dot: 'bg-zinc-500', cls: 'text-zinc-400 bg-zinc-800' }
  if (cat.registrationStatus === 'open')
    return { label: 'Đang nhận đăng ký', dot: 'bg-blue-500', cls: 'text-blue-300 bg-blue-950' }
  // closed
  if (cat.currentRound)
    return {
      label: `Đang đánh · ${cat.currentRound}`,
      dot: 'bg-orange-500',
      cls: 'text-orange-300 bg-orange-950',
    }
  return { label: 'Sẵn sàng vận hành', dot: 'bg-emerald-500', cls: 'text-emerald-300 bg-emerald-950' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENDER_LABEL: Record<GenderRequirement, string> = {
  men_only:     'nam only',
  women_only:   'nữ only',
  mixed_pair:   '1 nam + 1 nữ',
  unrestricted: 'không giới hạn',
}

function formatFee(fee: number, playerCount: 1 | 2): string {
  const vnd = fee.toLocaleString('vi-VN') + ' ₫'
  return playerCount === 1 ? `${vnd} / VĐV` : `${vnd} / cặp`
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  return `Đóng ${dd}.${mm}`
}

// ─── Lifecycle action button ──────────────────────────────────────────────────

function LifecycleButton({
  status,
  onAction,
}: {
  status: CategoryWithStats['registrationStatus']
  onAction: (action: 'open' | 'close') => void
}) {
  if (status === 'not_open')
    return (
      <button
        onClick={() => onAction('open')}
        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 rounded-md px-2.5 py-1 transition-colors"
      >
        Mở ĐK
      </button>
    )
  if (status === 'open')
    return (
      <button
        onClick={() => onAction('close')}
        className="text-[11px] font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-2.5 py-1 transition-colors"
      >
        Đóng ĐK
      </button>
    )
  return null
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

type Props = {
  category: CategoryWithStats
  onEdit: (id: string) => void
  onLifecycleAction: (id: string, action: 'open' | 'close') => void
}

export function CategoryRow({ category: cat, onEdit, onLifecycleAction }: Props) {
  const badge = getStatusBadge(cat)
  const fillPct = cat.maxTeams > 0 ? (cat.slotFilled / cat.maxTeams) * 100 : 0
  const isFull = cat.slotFilled >= cat.maxTeams

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors group">
      <div className="flex items-center gap-4 px-5 pt-4 pb-3">
        {/* Avatar */}
        <div
          className={cn(
            'w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 select-none',
            AVATAR_STYLE[cat.genderRequirement],
          )}
        >
          {cat.code.slice(0, 2)}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-white leading-snug">
              {cat.name}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                badge.cls,
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', badge.dot)} />
              {badge.label}
            </span>
            {cat.byeCount > 0 && (
              <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
                {cat.byeCount} bye
              </span>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3.5 mt-1.5 text-[12px] text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1 flex-shrink-0">
              {cat.playerCount === 1
                ? <User className="w-3 h-3 text-zinc-600" />
                : <Users className="w-3 h-3 text-zinc-600" />}
              {cat.playerCount} người · {GENDER_LABEL[cat.genderRequirement]}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <GitFork className="w-3 h-3 text-zinc-600" />
              Single elim · Best of {cat.bestOf}
            </span>
            {cat.fee > 0 && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <DollarSign className="w-3 h-3 text-zinc-600" />
                {formatFee(cat.fee, cat.playerCount)}
              </span>
            )}
            <span className="flex items-center gap-1 flex-shrink-0">
              <CalendarDays className="w-3 h-3 text-zinc-600" />
              {formatDeadline(cat.registrationDeadline)}
            </span>
          </div>
        </div>

        {/* Slot stats */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-[12px] tabular-nums min-w-[90px]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Slot</span>
            <span className={cn('font-semibold', isFull ? 'text-orange-400' : 'text-white')}>
              {cat.slotFilled}&thinsp;/&thinsp;{cat.maxTeams}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Đã thu</span>
            <span className="text-zinc-300 font-medium">
              {cat.slotPaid}&thinsp;/&thinsp;{cat.slotApproved}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          <LifecycleButton
            status={cat.registrationStatus}
            onAction={(action) => onLifecycleAction(cat.id, action)}
          />

          {cat.registrationStatus === 'closed' && (
            <button className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition-colors">
              <GitFork className="w-3 h-3" />
              Sơ đồ
            </button>
          )}

          <button
            onClick={() => onEdit(cat.id)}
            className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar — slot fill ratio */}
      <div className="mx-5 mb-3">
        <div className="h-[3px] bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
