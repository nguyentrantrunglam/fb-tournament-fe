'use client'

import { MapPin, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RefereeWithStats, RefereeStatus } from '@/lib/types/referee'

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  'bg-amber-700 text-amber-100',
  'bg-teal-700 text-teal-100',
  'bg-emerald-800 text-emerald-100',
  'bg-blue-800 text-blue-100',
  'bg-violet-800 text-violet-100',
  'bg-rose-800 text-rose-100',
  'bg-orange-700 text-orange-100',
  'bg-cyan-800 text-cyan-100',
]

function getAvatarColor(name: string): string {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeCfg = { label: string; dotCls: string; badgeCls: string; pulse: boolean }

const STATUS_BADGE: Record<RefereeStatus, BadgeCfg> = {
  online: {
    label: 'Online',
    dotCls: 'bg-red-500',
    badgeCls: 'text-red-300 bg-red-950',
    pulse: true,
  },
  available: {
    label: 'Sẵn sàng',
    dotCls: 'bg-emerald-500',
    badgeCls: 'text-emerald-300 bg-emerald-950',
    pulse: false,
  },
  offline: {
    label: 'Offline',
    dotCls: 'bg-zinc-500',
    badgeCls: 'text-zinc-500 bg-zinc-800',
    pulse: false,
  },
}

// ─── Sub-stat box ─────────────────────────────────────────────────────────────

function StatBox({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-zinc-800/60 rounded-md px-3 py-2.5', className)}>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="text-[13px] font-medium text-white">{children}</div>
    </div>
  )
}

// ─── RefereeCard ──────────────────────────────────────────────────────────────

type Props = {
  referee: RefereeWithStats
  onGoToConsole: (uid: string) => void
}

export function RefereeCard({ referee: ref, onGoToConsole }: Props) {
  const badge = STATUS_BADGE[ref.status]
  const avatarColor = ref.status === 'offline' ? 'bg-zinc-700 text-zinc-400' : getAvatarColor(ref.displayName)
  const isMultiCourt = ref.assignedCourts.length > 1
  const courtLabel =
    ref.assignedCourts.length > 0
      ? ref.assignedCourts.join(' + ')
      : ref.status === 'offline'
      ? '— offline'
      : '— chưa gán'

  const matchLabel =
    ref.matchesTodayCount > 0
      ? `${ref.matchesTodayCount} đã chấm`
      : '0 trận'

  return (
    <div
      className={cn(
        'bg-zinc-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors',
        isMultiCourt ? 'border-amber-800/60' : 'border-zinc-800 hover:border-zinc-700',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 select-none',
              avatarColor,
            )}
          >
            {getInitials(ref.displayName)}
          </div>

          {/* Name + phone */}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white leading-snug truncate">
              {ref.displayName}
            </p>
            <p className="text-[12px] text-zinc-500 mt-0.5">{ref.phone}</p>
          </div>
        </div>

        {/* Status badge + menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full',
              badge.badgeCls,
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                badge.dotCls,
                badge.pulse && 'animate-pulse',
              )}
            />
            {badge.label}
          </span>
          <button className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Sân hiện tại">
          <span
            className={cn(
              ref.assignedCourts.length > 0 ? 'text-white' : 'text-zinc-500',
              isMultiCourt && 'text-amber-400',
            )}
          >
            {courtLabel}
            {isMultiCourt && (
              <AlertTriangle className="inline w-3 h-3 ml-1 -mt-0.5 text-amber-400" />
            )}
          </span>
        </StatBox>
        <StatBox label="Trận hôm nay">
          <span className={ref.matchesTodayCount > 0 ? 'text-white' : 'text-zinc-500'}>
            {matchLabel}
          </span>
        </StatBox>
      </div>

      {/* Footer area */}
      {isMultiCourt && (
        <div className="flex items-center gap-1.5 text-[12px] text-amber-400 bg-amber-950/40 rounded-md px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Cảnh báo: đang kẹt {ref.assignedCourts.length} sân
        </div>
      )}

      {ref.status === 'available' && (
        <button
          onClick={() => onGoToConsole(ref.uid)}
          className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition-colors w-fit"
        >
          <MapPin className="w-3.5 h-3.5" />
          Gán vào sân
        </button>
      )}

      {ref.status === 'offline' && ref.lastSeenLabel && (
        <p className="text-[12px] text-zinc-600 italic">
          Hôm nay nghỉ. Online cuối: {ref.lastSeenLabel}
        </p>
      )}
    </div>
  )
}

// ─── InviteCTACard ────────────────────────────────────────────────────────────

export function InviteCTACard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[168px] transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
        <svg
          className="w-5 h-5 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors">
          Mời trọng tài
        </p>
        <p className="text-[11px] text-zinc-600 mt-0.5">
          Nhập SĐT / email · cấp role &apos;referee&apos;
        </p>
      </div>
    </button>
  )
}
