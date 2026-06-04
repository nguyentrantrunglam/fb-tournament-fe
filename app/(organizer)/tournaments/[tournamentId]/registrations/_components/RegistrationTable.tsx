'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, CheckCircle, XCircle, DollarSign, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaymentStatusToggle } from '@/components/registration/payment-status-toggle'
import type {
  RegistrationRow,
  RegistrationStatus,
  RegistrationPaymentStatus,
} from '@/lib/types/registration'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  'bg-amber-700 text-amber-100', 'bg-teal-700 text-teal-100',
  'bg-blue-800 text-blue-100', 'bg-violet-800 text-violet-100',
  'bg-rose-800 text-rose-100', 'bg-cyan-800 text-cyan-100',
]

function avatarColor(name: string): string {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]!
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

function formatFee(fee: number): string {
  return fee >= 1000 ? `${Math.round(fee / 1000)}k` : `${fee}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mi = d.getMinutes().toString().padStart(2, '0')
  return `${dd}.${mm} · ${hh}:${mi}`
}

const STATUS_BADGE: Record<RegistrationStatus, { label: string; cls: string; dot: string }> = {
  approved:  { label: 'Approved',  cls: 'text-emerald-300 bg-emerald-950', dot: 'bg-emerald-500' },
  pending:   { label: 'Pending',   cls: 'text-orange-300 bg-orange-950',   dot: 'bg-orange-500' },
  rejected:  { label: 'Rejected',  cls: 'text-red-300 bg-red-950',         dot: 'bg-red-500' },
  withdrawn: { label: 'Withdrawn', cls: 'text-zinc-500 bg-zinc-800',       dot: 'bg-zinc-600' },
}

// Not used in JSX directly — kept for type completeness reference
const _PAY_BADGE: Record<RegistrationPaymentStatus, { label: string; cls: string }> = {
  paid:   { label: 'đã thu',  cls: 'text-emerald-400 bg-emerald-950/60' },
  unpaid: { label: 'chờ thu', cls: 'text-amber-400 bg-amber-950/50' },
}
void _PAY_BADGE

// ─── Avatar tag ────────────────────────────────────────────────────────────────

function AvatarTag({ name, muted }: { name: string; muted?: boolean }) {
  return (
    <span className={cn('w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none',
      muted ? 'bg-zinc-700 text-zinc-400' : avatarColor(name))}>
      {initials(name)}
    </span>
  )
}

// ─── Row action menu ──────────────────────────────────────────────────────────

type RowAction = 'approve' | 'reject' | 'mark-paid' | 'unmark-paid'

function RowMenu({
  r,
  onAction,
}: {
  r: RegistrationRow
  onAction: (rid: string, action: RowAction) => void
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

  const isPending = r.status === 'pending'
  const isPaid = r.paymentStatus === 'paid'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl">
          {isPending && (
            <>
              <MenuItem icon={CheckCircle} label="Approve" cls="text-emerald-400"
                onClick={() => { onAction(r.id, 'approve'); setOpen(false) }} />
              <MenuItem icon={XCircle} label="Từ chối" cls="text-red-400"
                onClick={() => { onAction(r.id, 'reject'); setOpen(false) }} />
            </>
          )}
          {isPaid
            ? <MenuItem icon={MinusCircle} label="Bỏ đánh dấu đã thu" cls="text-amber-400"
                onClick={() => { onAction(r.id, 'unmark-paid'); setOpen(false) }} />
            : <MenuItem icon={DollarSign} label="Đánh dấu đã thu" cls="text-emerald-400"
                onClick={() => { onAction(r.id, 'mark-paid'); setOpen(false) }} />
          }
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, cls, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  cls?: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-300 hover:bg-zinc-700/60 transition-colors">
      <Icon className={cn('w-3.5 h-3.5', cls)} />{label}
    </button>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({ r, checked, onToggle, onAction, tournamentId }: {
  r: RegistrationRow
  checked: boolean
  onToggle: (id: string) => void
  onAction: (rid: string, action: RowAction) => void
  tournamentId: string
}) {
  const status = STATUS_BADGE[r.status]
  const dimmed = r.status === 'withdrawn' || r.status === 'rejected'

  return (
    <tr className={cn('border-b border-zinc-800/70 hover:bg-zinc-900/50 transition-colors', dimmed && 'opacity-60')}>
      <td className="px-4 py-3">
        <button role="checkbox" aria-checked={checked} onClick={() => onToggle(r.id)}
          className={cn('w-4 h-4 rounded flex items-center justify-center border transition-colors',
            checked ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-zinc-400')}>
          {checked && <span className="w-2 h-2 bg-white rounded-sm" />}
        </button>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <AvatarTag name={r.athleteName} muted={dimmed} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{r.athleteName}</p>
            <p className="text-[11px] text-zinc-500 font-mono">CCCD ···{r.cccdLast4} · {r.phoneMasked}</p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        {r.partnerName ? (
          <div className="flex items-center gap-2">
            <AvatarTag name={r.partnerName} muted={dimmed} />
            <span className="text-[12px] text-zinc-300 truncate">{r.partnerName}</span>
          </div>
        ) : <span className="text-zinc-600">—</span>}
      </td>
      <td className="py-3 pr-4">
        <span className="text-[12px] font-mono text-zinc-300">{r.categoryCode}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[13px] text-white tabular-nums">{formatFee(r.fee)}</span>
          <PaymentStatusToggle
            tournamentId={tournamentId}
            registrationId={r.id}
            paymentStatus={r.paymentStatus}
            disabled={dimmed}
          />
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-[12px] text-zinc-400 font-mono tabular-nums">{formatDate(r.registeredAt)}</span>
      </td>
      <td className="py-3 pr-4">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full', status.cls)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />{status.label}
        </span>
      </td>
      <td className="py-3 pr-4 text-right">
        <RowMenu r={r} onAction={onAction} />
      </td>
    </tr>
  )
}

// ─── Table ─────────────────────────────────────────────────────────────────────

const COLS = ['VĐV', 'ĐỐI TÁC (NẾU ĐÔI)', 'HẠNG MỤC', 'LỆ PHÍ', 'ĐĂNG KÝ', 'TRẠNG THÁI']

type Props = {
  rows: RegistrationRow[]
  selected: Set<string>
  allChecked: boolean
  onToggleRow: (id: string) => void
  onToggleAll: () => void
  onRowAction: (rid: string, action: RowAction) => void
  tournamentId: string
}

export function RegistrationTable({ rows, selected, allChecked, onToggleRow, onToggleAll, onRowAction, tournamentId }: Props) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800">
          <th className="px-4 py-2.5 w-10">
            <button role="checkbox" aria-checked={allChecked} onClick={onToggleAll}
              className={cn('w-4 h-4 rounded flex items-center justify-center border transition-colors',
                allChecked ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-zinc-400')}>
              {allChecked && <span className="w-2 h-2 bg-white rounded-sm" />}
            </button>
          </th>
          {COLS.map((c) => (
            <th key={c} className="py-2.5 pr-4 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{c}</th>
          ))}
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Row key={r.id} r={r} checked={selected.has(r.id)} onToggle={onToggleRow}
            onAction={onRowAction} tournamentId={tournamentId} />
        ))}
      </tbody>
    </table>
  )
}
