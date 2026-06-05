'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PersonTeamTable, type TeamTableRow } from '@/components/registration/person-team-table'
import type { RegistrationRow, RegistrationStatus, EditableStatus } from '@/lib/types/registration'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFee(fee: number): string {
  return fee >= 1000 ? `${Math.round(fee / 1000)}k` : `${fee}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const STATUS_BADGE: Record<RegistrationStatus, { label: string; cls: string; dot: string }> = {
  approved:  { label: 'Approved',  cls: 'text-emerald-300 bg-emerald-950', dot: 'bg-emerald-500' },
  pending:   { label: 'Pending',   cls: 'text-orange-300 bg-orange-950',   dot: 'bg-orange-500' },
  rejected:  { label: 'Rejected',  cls: 'text-red-300 bg-red-950',         dot: 'bg-red-500' },
  withdrawn: { label: 'Withdrawn', cls: 'text-zinc-500 bg-zinc-800',       dot: 'bg-zinc-600' },
}

const STATUS_ACTIONS: Record<EditableStatus, { label: string; icon: typeof CheckCircle; cls: string }> = {
  approved: { label: 'Duyệt',            icon: CheckCircle, cls: 'text-emerald-400' },
  pending:  { label: 'Chuyển chờ duyệt', icon: Clock,       cls: 'text-orange-400' },
  rejected: { label: 'Từ chối',          icon: XCircle,     cls: 'text-red-400' },
}
const EDITABLE_STATUSES: EditableStatus[] = ['approved', 'pending', 'rejected']

// ─── Row action menu ──────────────────────────────────────────────────────────

function RowMenu({
  r, onAction, onWithdraw,
}: {
  r: RegistrationRow
  onAction: (rid: string, t: EditableStatus) => void
  onWithdraw: (rid: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const targets = EDITABLE_STATUSES.filter((s) => s !== r.status)
  const isWithdrawn = r.status === 'withdrawn'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl">
          {isWithdrawn ? (
            <p className="px-3 py-2 text-[12px] text-zinc-500">Đội đã rút — không thể chỉnh</p>
          ) : (
            <>
              {targets.map((s) => {
                const a = STATUS_ACTIONS[s]
                return (
                  <button key={s} onClick={() => { onAction(r.id, s); setOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-300 hover:bg-zinc-700/60 transition-colors">
                    <a.icon className={cn('w-3.5 h-3.5', a.cls)} />{a.label}
                  </button>
                )
              })}
              <div className="my-1 border-t border-zinc-700/60" />
              <button
                onClick={() => { onWithdraw(r.id); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-red-400 hover:bg-zinc-700/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Rút đăng ký
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Map RegistrationRow[] → TeamTableRow[] ───────────────────────────────────

function toTableRows(
  rows: RegistrationRow[],
  selected: Set<string>,
  onToggle: (id: string) => void,
  onAction: (rid: string, t: EditableStatus) => void,
  onWithdraw: (rid: string) => void,
): TeamTableRow[] {
  return rows.map((r) => {
    const status = STATUS_BADGE[r.status]
    const dimmed = r.status === 'withdrawn' || r.status === 'rejected'

    const players: TeamTableRow['players'] = r.partnerName
      ? [
          { name: r.athleteName, avatarUrl: r.athleteAvatarUrl, cccd: r.athleteCccd, dob: r.athleteDob, phone: r.athletePhone, gender: r.athleteGender },
          { name: r.partnerName, avatarUrl: r.partnerAvatarUrl, cccd: r.partnerCccd, dob: r.partnerDob, phone: r.partnerPhone, gender: r.partnerGender },
        ]
      : [
          { name: r.athleteName, avatarUrl: r.athleteAvatarUrl, cccd: r.athleteCccd, dob: r.athleteDob, phone: r.athletePhone, gender: r.athleteGender },
        ]

    return {
      id: r.id,
      players,
      dimmed,
      leadCells: (span) => (
        <td rowSpan={span} className="px-4 align-middle w-10">
          <button role="checkbox" aria-checked={selected.has(r.id)} onClick={() => onToggle(r.id)}
            className={cn('w-4 h-4 rounded flex items-center justify-center border transition-colors',
              selected.has(r.id) ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-zinc-400')}>
            {selected.has(r.id) && <span className="w-2 h-2 bg-white rounded-sm" />}
          </button>
        </td>
      ),
      trailCells: (span) => (
        <>
          <td rowSpan={span} className="pr-4 align-middle">
            <span className="text-[12px] font-mono text-zinc-300">{r.categoryCode}</span>
          </td>
          <td rowSpan={span} className="pr-4 align-middle">
            <span className="text-[13px] text-white tabular-nums">{formatFee(r.fee)}</span>
          </td>
          <td rowSpan={span} className="pr-4 align-middle">
            <span className="text-[12px] text-zinc-400 font-mono tabular-nums">{formatDate(r.registeredAt)}</span>
          </td>
          <td rowSpan={span} className="pr-4 align-middle">
            <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full', status.cls)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />{status.label}
            </span>
          </td>
          <td rowSpan={span} className="pr-4 text-right align-middle">
            <RowMenu r={r} onAction={onAction} onWithdraw={onWithdraw} />
          </td>
        </>
      ),
    }
  })
}

// ─── Table ────────────────────────────────────────────────────────────────────

const TH = 'py-2.5 pr-4 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap'

type Props = {
  rows: RegistrationRow[]
  selected: Set<string>
  allChecked: boolean
  onToggleRow: (id: string) => void
  onToggleAll: () => void
  onRowAction: (rid: string, target: EditableStatus) => void
  onRowWithdraw: (rid: string) => void
}

export function RegistrationTable({ rows, selected, allChecked, onToggleRow, onToggleAll, onRowAction, onRowWithdraw }: Props) {
  const tableRows = toTableRows(rows, selected, onToggleRow, onRowAction, onRowWithdraw)

  return (
    <PersonTeamTable
      rows={tableRows}
      leadHeaders={
        <th className="px-4 py-2.5 w-10">
          <button role="checkbox" aria-checked={allChecked} onClick={onToggleAll}
            className={cn('w-4 h-4 rounded flex items-center justify-center border transition-colors',
              allChecked ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-zinc-400')}>
            {allChecked && <span className="w-2 h-2 bg-white rounded-sm" />}
          </button>
        </th>
      }
      trailHeaders={
        <>
          <th className={TH}>Hạng mục</th>
          <th className={TH}>Lệ phí</th>
          <th className={TH}>Ngày đăng ký</th>
          <th className={TH}>Trạng thái</th>
          <th className="w-10" />
        </>
      }
    />
  )
}
