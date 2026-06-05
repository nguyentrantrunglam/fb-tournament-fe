'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Shuffle } from 'lucide-react'
import { KnockoutBracket } from './KnockoutBracket'
import { RoundRobinView } from './RoundRobinView'
import { GroupKoView } from './GroupKoView'
import { GroupKoConfigDialog } from './group-ko-config-dialog'
import { useBracket, useCreateSkeleton, useDrawBracket, useBracketRealtime } from '@/lib/bracket/queries'
import type { CategoryWithStats } from '@/lib/types/category'
import type { BracketMeta } from '@/lib/types/bracket'

// ─── MetaBar ─────────────────────────────────────────────────────────────────

function MetaCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{label}</p>
      <p className="text-white mt-0.5">{value}</p>
    </div>
  )
}

function MetaBar({ meta, drawVersion }: { meta: BracketMeta; drawVersion: number }) {
  return (
    <div className="flex items-center gap-6 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[13px]">
      <MetaCell label="Mode" value={meta.mode} />
      {meta.bracketSize != null && <MetaCell label="Bracket size" value={meta.bracketSize} />}
      <MetaCell label="Bye" value={meta.byes} />
      {meta.roundsLabel && <MetaCell label="Vòng" value={meta.roundsLabel} />}
      <MetaCell label="Phiên bản" value={`v${drawVersion}`} />
    </div>
  )
}

// ─── Empty states ──────────────────────────────────────────────────────────────

function NotClosedPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500 text-sm">
      <p className="text-zinc-400 font-medium">Chưa thể dựng khung</p>
      <p>Đóng đăng ký trước khi dựng khung thi đấu.</p>
    </div>
  )
}

function NoBracketPlaceholder({
  format,
  onBuild,
  isPending,
}: {
  format: CategoryWithStats['format']
  onBuild: () => void
  isPending: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-zinc-500 text-sm">
      <p className="text-zinc-400 font-medium">Chưa có sơ đồ thi đấu</p>
      <p>Dựng khung để tạo sơ đồ {format === 'group_ko' ? 'vòng bảng + loại trực tiếp' : format === 'round_robin' ? 'vòng tròn' : 'loại trực tiếp'}.</p>
      <button
        onClick={onBuild}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Dựng khung
      </button>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type Props = {
  category: CategoryWithStats
}

export function BracketCategoryPanel({ category }: Props) {
  const [showGroupKoDialog, setShowGroupKoDialog] = useState(false)

  useBracketRealtime(category.id)

  const { data: bracket, isLoading } = useBracket(category.id)
  const skeletonMutation = useCreateSkeleton(category.id)
  const drawMutation = useDrawBracket(category.id)

  const isPendingSkeleton = skeletonMutation.isPending
  const isPendingDraw = drawMutation.isPending

  // ── State machine ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải sơ đồ…
      </div>
    )
  }

  const isClosed = category.registrationStatus === 'closed'

  if (!isClosed) {
    return <NotClosedPlaceholder />
  }

  function handleBuildSkeleton() {
    if (category.format === 'group_ko') {
      setShowGroupKoDialog(true)
    } else {
      skeletonMutation.mutate(undefined)
    }
  }

  if (!bracket) {
    return (
      <>
        <NoBracketPlaceholder
          format={category.format}
          onBuild={handleBuildSkeleton}
          isPending={isPendingSkeleton}
        />
        <GroupKoConfigDialog
          open={showGroupKoDialog}
          onOpenChange={setShowGroupKoDialog}
          onConfirm={(cfg) => {
            skeletonMutation.mutate(cfg, { onSuccess: () => setShowGroupKoDialog(false) })
          }}
          isPending={isPendingSkeleton}
        />
      </>
    )
  }

  // ── Bracket exists: skeleton or drawn ─────────────────────────────────────

  const isDrawn = bracket.status === 'drawn'

  const drawAction = (
    <button
      onClick={() => drawMutation.mutate()}
      disabled={isPendingDraw}
      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
    >
      {isPendingDraw ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Shuffle className="w-4 h-4" />
      )}
      {isDrawn ? 'Bốc lại' : 'Bốc thăm'}
    </button>
  )

  const redrawBadge = isDrawn && (
    <span className="flex items-center gap-1 text-xs text-zinc-400 border border-zinc-700 px-2.5 py-1.5 rounded-md">
      <RotateCcw className="w-3.5 h-3.5" />
      {bracket.drawVersion} lần bốc
    </span>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <MetaBar meta={bracket.meta} drawVersion={bracket.drawVersion} />
        <div className="ml-auto flex items-center gap-2">
          {redrawBadge}
          {drawAction}
        </div>
      </div>

      {/* Diagram area */}
      <div className="min-h-0">
        {bracket.format === 'single_elim' && bracket.knockout && (
          <KnockoutBracket rounds={bracket.knockout} />
        )}
        {bracket.format === 'round_robin' && bracket.roundRobin && (
          <RoundRobinView data={bracket.roundRobin} />
        )}
        {bracket.format === 'group_ko' && bracket.groupKo && (
          <GroupKoView data={bracket.groupKo} />
        )}
      </div>
    </div>
  )
}
