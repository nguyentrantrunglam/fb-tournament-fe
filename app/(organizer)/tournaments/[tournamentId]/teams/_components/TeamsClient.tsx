'use client'

import { useCallback, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '../../_components/PageLayout'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { SeedInput } from '@/components/registration/seed-input'
import { TeamPhotoUploader } from '@/components/registration/team-photo-uploader'
import { PersonTeamTable, type TeamTableRow } from '@/components/registration/person-team-table'
import { useTeams, useTeamsRealtime } from '@/lib/teams/queries'
import type { TeamEntry, CategoryTeams } from '@/lib/types/team'

const PAGE_SIZE = 30

// ─── Map TeamEntry[] → TeamTableRow[] ────────────────────────────────────────

function toTableRows(teams: TeamEntry[], tournamentId: string): TeamTableRow[] {
  return teams.map((team, i) => {
    const [p0, p1] = team.players

    const players: TeamTableRow['players'] = p1
      ? [
          { name: p0!.name, avatarUrl: null, cccd: p0!.cccd, dob: p0!.dob, phone: p0!.phone, gender: p0!.gender },
          { name: p1.name,  avatarUrl: null, cccd: p1.cccd,  dob: p1.dob,  phone: p1.phone,  gender: p1.gender  },
        ]
      : [
          { name: p0!.name, avatarUrl: null, cccd: p0!.cccd, dob: p0!.dob, phone: p0!.phone, gender: p0!.gender },
        ]

    return {
      id: team.id,
      players,
      leadCells: (span) => (
        <>
          <td rowSpan={span} className="px-4 text-[12px] text-zinc-600 tabular-nums align-middle w-10">
            {i + 1}
          </td>
          <td rowSpan={span} className="pr-4 align-middle w-20">
            <TeamPhotoUploader
              tournamentId={tournamentId}
              registrationId={team.id}
              currentPhotoUrl={team.teamPhotoUrl}
              compact
            />
          </td>
        </>
      ),
      trailCells: (span) => (
        <td rowSpan={span} className="pr-4 align-middle w-36">
          <SeedInput
            tournamentId={tournamentId}
            registrationId={team.id}
            currentSeed={team.seed}
          />
        </td>
      ),
    }
  })
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

const TH = 'py-2.5 pr-4 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap'

function TeamTable({ teams, tournamentId, active }: { teams: TeamEntry[]; tournamentId: string; active: CategoryTeams }) {
  if (teams.length === 0) {
    return (
      <div className="mt-4 flex items-center justify-center h-40 rounded-xl border border-dashed border-zinc-800 text-[13px] text-zinc-600">
        Chưa có đội nào approved cho nội dung này.
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 overflow-hidden">
      <PersonTeamTable
        rows={toTableRows(teams, tournamentId)}
        leadHeaders={
          <>
            <th className="px-4 py-2.5 w-10" />
            <th className={cn(TH, 'w-20')}>Ảnh đội</th>
          </>
        }
        trailHeaders={
          <th className={cn(TH, 'w-36')}>Seed</th>
        }
      />
    </div>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function TeamsClient({ tournamentId }: { tournamentId: string }) {
  const { data: categories = [], isLoading } = useTeams(tournamentId)
  useTeamsRealtime(tournamentId)

  const [activeId, setActiveId] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const resolvedActiveId = activeId || categories.at(-1)?.id || categories[0]?.id || ''

  const [prevActiveId, setPrevActiveId] = useState(resolvedActiveId)
  if (prevActiveId !== resolvedActiveId) {
    setPrevActiveId(resolvedActiveId)
    setVisibleCount(PAGE_SIZE)
  }

  const active = useMemo(
    () => categories.find((c) => c.id === resolvedActiveId) ?? categories[0],
    [categories, resolvedActiveId],
  )

  const loadMore = useCallback(() => setVisibleCount((v) => v + PAGE_SIZE), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đội…
      </div>
    )
  }

  if (!active) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Danh sách đội"
          description="Danh sách đội đã duyệt · gán seed & ảnh đội cho từng đội"
        />
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-zinc-800 mx-8 text-[13px] text-zinc-600">
          Chưa có nội dung nào hoặc chưa có đội approved.
        </div>
      </div>
    )
  }

  const unit = active.playerCount === 1 ? 'VĐV' : 'cặp'
  const visible = active.teams.slice(0, visibleCount)
  const hasMore = visibleCount < active.teams.length

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Danh sách đội"
        description="Danh sách đội đã duyệt · gán seed & ảnh đội cho từng đội"
      />

      {/* Category tabs */}
      <div className="shrink-0 px-8">
        <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
                c.id === resolvedActiveId
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              <span className="font-mono text-zinc-500">{c.code}</span>
              · {c.name}
              <span className="text-[11px] tabular-nums text-zinc-500">{c.approvedCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-6 pt-5">
        {/* Status bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[12px] font-bold text-zinc-300 flex-shrink-0">
            {active.code}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white">
              {active.name} · {active.approvedCount} {unit} đã approved
            </p>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {active.seededCount} {unit} đã có seed
            </p>
          </div>
        </div>

        <TeamTable teams={visible} tournamentId={tournamentId} active={active} />

        <InfiniteScrollSentinel hasMore={hasMore} onLoadMore={loadMore} label={`Đang tải thêm ${unit}…`} />
      </div>
    </div>
  )
}
