'use client'

import { User, Users, GitFork, CalendarDays, DollarSign, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryWithStats, GenderRequirement, CategoryFormat } from '@/lib/types/category'

const FORMAT_LABEL: Record<CategoryFormat, string> = {
  single_elim: 'Loại trực tiếp',
  round_robin: 'Vòng tròn',
  group_ko: 'Bảng + KO',
}

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
        className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 rounded-md px-3 py-1.5 transition-colors"
      >
        Mở ĐK
      </button>
    )
  if (status === 'open')
    return (
      <button
        onClick={() => onAction('close')}
        className="text-[12px] font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition-colors"
      >
        Đóng ĐK
      </button>
    )
  return null
}

// ─── Meta chip ──────────────────────────────────────────────────────────────────

function MetaChip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[12px] text-zinc-500">
      <Icon className="w-3 h-3 text-zinc-600" />
      {children}
    </span>
  )
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

type Props = {
  category: CategoryWithStats
  onEdit: (id: string) => void
  onLifecycleAction: (id: string, action: 'open' | 'close') => void
}

export function CategoryCard({ category: cat, onEdit, onLifecycleAction }: Props) {
  const badge = getStatusBadge(cat)
  const fillPct = cat.maxTeams > 0 ? (cat.slotFilled / cat.maxTeams) * 100 : 0
  const isFull = cat.slotFilled >= cat.maxTeams

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 select-none',
            AVATAR_STYLE[cat.genderRequirement],
          )}
        >
          {cat.code.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white leading-snug truncate">{cat.name}</p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
              badge.cls,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', badge.dot)} />
            {badge.label}
          </span>
        </div>

        <button
          onClick={() => onEdit(cat.id)}
          className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0"
          title="Chỉnh sửa"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        <MetaChip icon={cat.playerCount === 1 ? User : Users}>
          {cat.playerCount} người · {GENDER_LABEL[cat.genderRequirement]}
        </MetaChip>
        <MetaChip icon={GitFork}>{FORMAT_LABEL[cat.format]} · Best of {cat.bestOf}</MetaChip>
        {cat.fee > 0 && <MetaChip icon={DollarSign}>{formatFee(cat.fee, cat.playerCount)}</MetaChip>}
        <MetaChip icon={CalendarDays}>{formatDeadline(cat.registrationDeadline)}</MetaChip>
        {cat.byeCount > 0 && (
          <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {cat.byeCount} bye
          </span>
        )}
      </div>

      {/* Slot stats + progress */}
      <div>
        <div className="flex items-center justify-between text-[12px] tabular-nums">
          <span className="text-zinc-500">
            Slot{' '}
            <span className={cn('font-semibold', isFull ? 'text-orange-400' : 'text-white')}>
              {cat.slotFilled}/{cat.maxTeams}
            </span>
          </span>
          <span className="text-zinc-500">
            Đã thu <span className="text-zinc-300 font-medium">{cat.slotPaid}/{cat.slotApproved}</span>
          </span>
        </div>
        <div className="h-[3px] bg-zinc-800 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <LifecycleButton status={cat.registrationStatus} onAction={(a) => onLifecycleAction(cat.id, a)} />
        {cat.registrationStatus === 'closed' && (
          <button className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition-colors">
            <GitFork className="w-3 h-3" />
            Sơ đồ
          </button>
        )}
      </div>
    </div>
  )
}
