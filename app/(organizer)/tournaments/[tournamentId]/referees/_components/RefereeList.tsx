'use client'

import { useState } from 'react'
import { Link2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RefereeCard, InviteCTACard } from './RefereeCard'
import { InviteRefereeDialog } from './InviteRefereeDialog'
import type { RefereeWithStats } from '@/lib/types/referee'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueCls,
}: {
  label: string
  value: number
  valueCls?: string
}) {
  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={cn('text-[32px] font-bold leading-none tabular-nums', valueCls ?? 'text-white')}>
        {value}
      </p>
    </div>
  )
}

// ─── RefereeList ──────────────────────────────────────────────────────────────

type Props = {
  referees: RefereeWithStats[]
  tournamentId: string
}

export function RefereeList({ referees, tournamentId }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Computed stats
  const total         = referees.length
  const assigned      = referees.filter((r) => r.assignedCourts.length > 0).length
  const matchesToday  = referees.reduce((sum, r) => sum + r.matchesTodayCount, 0)
  const offline       = referees.filter((r) => r.status === 'offline').length

  const description =
    total === 0
      ? 'Chưa có trọng tài nào. Mời trọng tài để bắt đầu.'
      : `${total} trọng tài đã mời · gán vào sân ở route Vận hành LIVE.`

  async function handleCopyLink() {
    const link = `${window.location.origin}/tournaments/${tournamentId}/invite?role=referee`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleGoToConsole(_uid: string) {
    // Navigate sang Operations Console — chỉ có thể gán sân ở đó
    window.location.href = `/tournaments/${tournamentId}/live`
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header (cố định) ── */}
      <div className="flex-shrink-0 flex items-start justify-between gap-6 px-8 pt-7 pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-white leading-tight">Trọng tài</h1>
          <p className="text-[13px] text-zinc-400 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            {copied ? 'Đã sao chép!' : 'Sao chép link mời'}
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Mời trọng tài
          </button>
        </div>
      </div>

      {/* ── Body (scroll) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-7">
      {/* ── Stats row ── */}
      <div className="flex gap-3 mt-5">
        <StatCard label="Tổng" value={total} />
        <StatCard
          label="Đang gán sân"
          value={assigned}
          valueCls={assigned > 0 ? 'text-teal-400' : 'text-zinc-500'}
        />
        <StatCard label="Trận chấm hôm nay" value={matchesToday} />
        <StatCard
          label="Đang offline"
          value={offline}
          valueCls={offline > 0 ? 'text-zinc-400' : 'text-zinc-600'}
        />
      </div>

      {/* ── Referee grid ── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {referees.map((ref) => (
          <RefereeCard key={ref.uid} referee={ref} onGoToConsole={handleGoToConsole} />
        ))}

        {/* Invite CTA always visible */}
        <InviteCTACard onClick={() => setInviteOpen(true)} />
      </div>
      </div>

      {/* ── Invite dialog ── */}
      <InviteRefereeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tournamentId={tournamentId}
      />
    </div>
  )
}
