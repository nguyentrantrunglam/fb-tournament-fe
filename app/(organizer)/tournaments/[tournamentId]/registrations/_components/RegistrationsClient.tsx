'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download, UserPlus, Upload, Search, X, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, PageBody } from '../../_components/PageLayout'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { CategoryFilterDropdown } from './CategoryFilterDropdown'
import { RegistrationTable } from './RegistrationTable'
import { ConfigTeamDialog } from './ConfigTeamDialog'
import { OrganizerSingleForm } from '@/components/registration/organizer-single-form'
import { OrganizerBulkForm } from '@/components/registration/organizer-bulk-form'
import { useRegistrations, useSetStatus } from '@/lib/registrations/queries'
import { useRegistrationsRealtime } from '@/lib/registrations/use-registrations-realtime'
import { fetchCategories } from '@/lib/tournaments/api'
import { useQuery } from '@tanstack/react-query'
import type { RegistrationRow, RegistrationStatus, EditableStatus, CategoryFilterOption } from '@/lib/types/registration'

const PAGE_SIZE = 20
type StatusTab = 'all' | RegistrationStatus

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

type Props = {
  tournamentId: string
  categories: CategoryFilterOption[]
  registrations: RegistrationRow[]
  totalCount: number
}

export function RegistrationsClient({ tournamentId, categories, registrations, totalCount }: Props) {
  const [tab, setTab] = useState<StatusTab>('all')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [singleOpen, setSingleOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  // Subscribe to socket room so registration:updated events invalidate the query automatically
  useRegistrationsRealtime(tournamentId)

  // Refetch live data so mutations update the list
  const { data: liveData } = useRegistrations(tournamentId)
  const rows = liveData?.registrations ?? registrations
  const liveTotal = liveData?.totalCount ?? totalCount

  const { data: fullCategories = [] } = useQuery({
    queryKey: ['categories-full', tournamentId],
    queryFn: () => fetchCategories(tournamentId),
    staleTime: 60_000,
  })

  const setStatus = useSetStatus(tournamentId)

  const countByCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows) m[r.categoryId] = (m[r.categoryId] ?? 0) + 1
    return m
  }, [rows])

  const countByStatus = useMemo(() => {
    const m: Record<string, number> = { all: rows.length }
    for (const r of rows) m[r.status] = (m[r.status] ?? 0) + 1
    return m
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false
      if (selectedCats.size > 0 && !selectedCats.has(r.categoryId)) return false
      if (q && !r.athleteName.toLowerCase().includes(q) && !r.cccdLast4.includes(q)) return false
      return true
    })
  }, [rows, tab, selectedCats, search])

  const filterKey = `${tab}|${[...selectedCats].sort().join(',')}|${search.trim().toLowerCase()}`
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) { setPrevFilterKey(filterKey); setVisibleCount(PAGE_SIZE) }

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = visibleCount < filtered.length
  const loadMore = useCallback(() => setVisibleCount((v) => v + PAGE_SIZE), [])
  const allChecked = visibleRows.length > 0 && visibleRows.every((r) => selectedRows.has(r.id))

  function toggleInSet(prev: Set<string>, id: string) {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    return next
  }
  function toggleCat(id: string) { setSelectedCats((p) => toggleInSet(p, id)) }
  function toggleRow(id: string) { setSelectedRows((p) => toggleInSet(p, id)) }
  function toggleAll() { setSelectedRows(allChecked ? new Set() : new Set(visibleRows.map((r) => r.id))) }

  function bulkApprove() { selectedRows.forEach((rid) => setStatus.mutate({ rid, status: 'approved' })) }
  function bulkReject() { selectedRows.forEach((rid) => setStatus.mutate({ rid, status: 'rejected' })) }

  function handleRowAction(rid: string, target: EditableStatus) {
    setStatus.mutate({ rid, status: target })
  }

  // Approved rows surfaced by current filters for ConfigTeamDialog
  const approvedRows = useMemo(
    () => filtered.filter((r) => r.status === 'approved'),
    [filtered],
  )

  const actions = (
    <>
      <HeaderBtn icon={Download} label="Xuất CSV" onClick={() => {}} />
      <HeaderBtn icon={Settings2} label="Config đội" onClick={() => setConfigOpen(true)} />
      <HeaderBtn icon={UserPlus} label="Đăng ký 1 đội" onClick={() => setSingleOpen(true)} />
      <button
        onClick={() => setBulkOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Upload className="w-4 h-4" /> Bulk import
      </button>
    </>
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Đăng ký"
        description={`${liveTotal} đăng ký`}
        actions={actions}
      />

      <div className="flex-shrink-0 px-8">
        <div className="flex items-center gap-1 border-b border-zinc-800">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
              {t.label}
              <span className="text-[11px] tabular-nums text-zinc-500">{countByStatus[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 pb-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, CCCD…"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors" />
          </div>
          <CategoryFilterDropdown categories={categories} selected={selectedCats} counts={countByCat} onToggle={toggleCat} onClear={() => setSelectedCats(new Set())} />
        </div>
      </div>

      <PageBody>
        <div className="px-8 py-4">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-4 mt-4 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <span className="flex items-center gap-2 text-[13px] text-white">
                <span className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center"><span className="w-2 h-2 bg-white rounded-sm" /></span>
                {selectedRows.size} đăng ký đã chọn
              </span>
              <BulkAction label="Approve tất cả" onClick={bulkApprove} />
              <BulkAction label="Từ chối" onClick={bulkReject} />
              <button onClick={() => setSelectedRows(new Set())} className="ml-auto flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-3.5 h-3.5" /> Bỏ chọn
              </button>
            </div>
          )}
          <div className="mt-4">
            <RegistrationTable rows={visibleRows} selected={selectedRows} allChecked={allChecked}
              onToggleRow={toggleRow} onToggleAll={toggleAll} onRowAction={handleRowAction} />
          </div>
          <InfiniteScrollSentinel hasMore={hasMore} onLoadMore={loadMore} />
          <p className="text-center mt-2 text-[12px] text-zinc-600">
            Hiển thị {visibleRows.length} trên {liveTotal}
          </p>
        </div>
      </PageBody>

      <OrganizerSingleForm open={singleOpen} onOpenChange={setSingleOpen}
        tournamentId={tournamentId} categories={fullCategories} onCreated={() => setSingleOpen(false)} />
      <OrganizerBulkForm open={bulkOpen} onOpenChange={setBulkOpen}
        tournamentId={tournamentId} categories={fullCategories} onDone={() => setBulkOpen(false)} />
      <ConfigTeamDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        tournamentId={tournamentId}
        registrations={approvedRows}
      />
    </div>
  )
}

function HeaderBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  )
}

function BulkAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[13px] text-zinc-300 hover:text-white transition-colors">{label}</button>
  )
}
