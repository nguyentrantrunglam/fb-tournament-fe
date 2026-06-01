'use client'

import { MoreHorizontal, AlertTriangle, Play, CircleSlash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CourtRefereePicker } from './CourtRefereePicker'
import type { CourtWithState, RefereeOption, CourtStatus } from '@/lib/types/court'

type StatusCfg = { label: string; dotCls: string; textCls: string }

const STATUS_CFG: Record<CourtStatus, StatusCfg> = {
  in_use:    { label: 'Đang sử dụng',       dotCls: 'bg-emerald-500', textCls: 'text-emerald-400' },
  preparing: { label: 'Đang chuẩn bị trận', dotCls: 'bg-blue-500',    textCls: 'text-blue-400' },
  idle:      { label: 'Sân trống',          dotCls: 'bg-zinc-600',    textCls: 'text-zinc-500' },
}

type Props = {
  court: CourtWithState
  referees: RefereeOption[]
  conflictCourtName: string | null // tên sân khác dùng chung trọng tài, null nếu không trùng
  onAssignReferee: (courtId: string, uid: string | null) => void
  onStartMatch: (courtId: string) => void
  onOpenMatch: (matchId: string) => void
}

export function CourtCard({
  court,
  referees,
  conflictCourtName,
  onAssignReferee,
  onStartMatch,
  onOpenMatch,
}: Props) {
  const status = STATUS_CFG[court.status]
  const m = court.match
  const hasReferee = court.currentRefereeUid !== null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* ── Header: số sân + tên + status + menu ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[17px] font-bold text-white flex-shrink-0 select-none">
            {court.order}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white leading-tight">{court.name}</p>
            <span className={cn('inline-flex items-center gap-1.5 mt-0.5 text-[12px]', status.textCls)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dotCls)} />
              {status.label}
            </span>
          </div>
        </div>
        <button className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Trọng tài cố định ── */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
          Trọng tài cố định
        </p>
        <CourtRefereePicker
          referees={referees}
          selectedUid={court.currentRefereeUid}
          hasConflict={conflictCourtName !== null}
          onSelect={(uid) => onAssignReferee(court.id, uid)}
        />
        {conflictCourtName && (
          <p className="flex items-center gap-1 text-[11px] text-amber-400 mt-1.5">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            trùng {conflictCourtName} — cần đổi
          </p>
        )}
        {!hasReferee && (
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Cần gán trọng tài trước khi sân nhận trận.
          </p>
        )}
      </div>

      {/* ── Trận đang chạy / chuẩn bị / trống ── */}
      {m ? (
        <div>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
            {court.status === 'in_use' ? 'Trận đang chạy' : 'Trận chuẩn bị'}
          </p>
          <div
            className={cn(
              'rounded-lg border bg-zinc-950/50 p-3',
              court.status === 'in_use'
                ? 'border-l-2 border-l-red-500 border-y-zinc-800 border-r-zinc-800 cursor-pointer hover:bg-zinc-950'
                : 'border-zinc-800',
            )}
            onClick={court.status === 'in_use' ? () => onOpenMatch(m.matchId) : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono text-red-400/90 tracking-wide">
                {m.categoryCode} · {m.roundLabel} · {m.matchNo}
              </p>
              <span className="text-[11px] text-zinc-500">
                {court.status === 'in_use' ? m.gameLabel : 'chưa bắt đầu'}
              </span>
            </div>
            <p className="text-[13px] text-zinc-300 mt-1.5">
              {m.sideAName} <span className="text-zinc-600">vs</span> {m.sideBName}
            </p>
            {court.status === 'in_use' && (
              <p className="text-[22px] font-bold text-white tabular-nums mt-1.5">
                {m.scoreA} <span className="text-zinc-600">—</span> {m.scoreB}
              </p>
            )}
          </div>

          {court.status === 'preparing' && (
            <button
              onClick={() => onStartMatch(court.id)}
              disabled={!hasReferee}
              className={cn(
                'mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors',
                hasReferee
                  ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500'
                  : 'border-zinc-800 text-zinc-600 cursor-not-allowed',
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Bắt đầu
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-800 py-6 text-center">
          <CircleSlash className="w-5 h-5 text-zinc-700" />
          <p className="text-[12px] text-zinc-600">Sân trống — chưa có trận</p>
          <p className="text-[11px] text-zinc-700">Kéo match vào sân ở Vận hành LIVE</p>
        </div>
      )}
    </div>
  )
}
