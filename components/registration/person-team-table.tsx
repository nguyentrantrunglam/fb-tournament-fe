'use client'

import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonData = {
  name: string
  avatarUrl: string | null
  cccd: string | null
  dob: string | null
  phone: string | null
  gender: 'male' | 'female' | null
}

export type TeamTableRow = {
  id: string
  players: [PersonData] | [PersonData, PersonData]
  /** Dim entire row (withdrawn / rejected) */
  dimmed?: boolean
  /** Cells rendered before person columns — use rowSpan={span} internally */
  leadCells: (span: number) => React.ReactNode
  /** Cells rendered after person columns — use rowSpan={span} internally */
  trailCells: (span: number) => React.ReactNode
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  'bg-amber-700 text-amber-100', 'bg-teal-700 text-teal-100',
  'bg-blue-800 text-blue-100',   'bg-violet-800 text-violet-100',
  'bg-rose-800 text-rose-100',   'bg-cyan-800 text-cyan-100',
]

function avatarColor(name: string): string {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]!
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

export function formatDob(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, muted }: { name: string; avatarUrl: string | null; muted: boolean }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name}
        className={cn('w-7 h-7 rounded-full object-cover shrink-0', muted && 'opacity-60')} />
    )
  }
  return (
    <span className={cn(
      'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 select-none',
      muted ? 'bg-zinc-700 text-zinc-400' : avatarColor(name),
    )}>
      {initials(name)}
    </span>
  )
}

// ─── Per-person cells ─────────────────────────────────────────────────────────

function PersonCells({ person, primary, muted }: { person: PersonData; primary: boolean; muted: boolean }) {
  const nameCls = muted ? 'text-zinc-500' : primary ? 'text-white' : 'text-zinc-300'

  return (
    <>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={person.name} avatarUrl={person.avatarUrl} muted={muted} />
          <span className={cn('text-[13px] truncate', nameCls)}>{person.name}</span>
        </div>
      </td>
      <td className="py-2.5 pr-4">
        <span className={cn('text-[12px] font-mono', muted ? 'text-zinc-600' : 'text-zinc-300')}>
          {person.cccd ?? '—'}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <span className={cn('text-[12px] tabular-nums', muted ? 'text-zinc-600' : 'text-zinc-300')}>
          {formatDob(person.dob)}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <span className={cn('text-[12px] font-mono', muted ? 'text-zinc-600' : 'text-zinc-300')}>
          {person.phone ?? '—'}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <span className={cn('text-[12px]', muted ? 'text-zinc-600' : 'text-zinc-300')}>
          {person.gender === 'male' ? 'Nam' : person.gender === 'female' ? 'Nữ' : '—'}
        </span>
      </td>
    </>
  )
}

// ─── Row group ────────────────────────────────────────────────────────────────

function RowGroup({ row }: { row: TeamTableRow }) {
  const [p0, p1] = row.players
  const isDoubles = row.players.length === 2
  const span = isDoubles ? 2 : 1
  const dim = row.dimmed ?? false

  const firstCls = cn(
    'transition-colors hover:bg-zinc-900/40',
    isDoubles ? 'border-b border-zinc-800/20' : 'border-b border-zinc-800/70',
  )
  const secondCls = 'border-b border-zinc-800/70 transition-colors hover:bg-zinc-900/40'

  if (!isDoubles) {
    return (
      <tr className={firstCls}>
        {row.leadCells(span)}
        <PersonCells person={p0} primary muted={dim} />
        {row.trailCells(span)}
      </tr>
    )
  }

  return (
    <>
      <tr className={firstCls}>
        {row.leadCells(span)}
        <PersonCells person={p0} primary muted={dim} />
        {row.trailCells(span)}
      </tr>
      <tr className={secondCls}>
        <PersonCells person={p1!} primary={false} muted={dim} />
      </tr>
    </>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

const PERSON_COL_HEADERS = ['TÊN', 'CCCD', 'NGÀY SINH', 'SĐT', 'GIỚI TÍNH']

type Props = {
  rows: TeamTableRow[]
  leadHeaders?: React.ReactNode
  trailHeaders?: React.ReactNode
}

export function PersonTeamTable({ rows, leadHeaders, trailHeaders }: Props) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800">
          {leadHeaders}
          {PERSON_COL_HEADERS.map((c) => (
            <th key={c} className="py-2.5 pr-4 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
              {c}
            </th>
          ))}
          {trailHeaders}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <RowGroup key={row.id} row={row} />
        ))}
      </tbody>
    </table>
  )
}
