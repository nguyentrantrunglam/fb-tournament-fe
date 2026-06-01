'use client'

import { useMemo, useState } from 'react'
import { Download, UserPlus, Upload, Search, Filter, CreditCard, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, PageBody } from '../../_components/PageLayout'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import { RegistrationTable } from './RegistrationTable'
import type {
  RegistrationRow,
  RegistrationStatus,
  CategoryFilterOption,
} from '@/lib/types/registration'

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

export function RegistrationsClient({ categories, registrations, totalCount }: Props) {
  const [tab, setTab] = useState<StatusTab>('all')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const countByCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of registrations) m[r.categoryId] = (m[r.categoryId] ?? 0) + 1
    return m
  }, [registrations])

  const countByStatus = useMemo(() => {
    const m: Record<string, number> = { all: registrations.length }
    for (const r of registrations) m[r.status] = (m[r.status] ?? 0) + 1
    return m
  }, [registrations])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return registrations.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false
      if (selectedCats.size > 0 && !selectedCats.has(r.categoryId)) return false
      if (q && !r.athleteName.toLowerCase().includes(q) && !r.cccdLast4.includes(q)) return false
      return true
    })
  }, [registrations, tab, selectedCats, search])

  const allChecked = rows.length > 0 && rows.every((r) => selectedRows.has(r.id))

  function toggleInSet(prev: Set<string>, id: string): Set<string> {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }
  function toggleCat(id: string) {
    setSelectedCats((prev) => toggleInSet(prev, id))
  }
  function toggleRow(id: string) {
    setSelectedRows((prev) => toggleInSet(prev, id))
  }
  function toggleAll() {
    setSelectedRows(allChecked ? new Set() : new Set(rows.map((r) => r.id)))
  }

  const actions = (
    <>
      <HeaderBtn icon={Download} label="Xuất CSV" />
      <HeaderBtn icon={UserPlus} label="Đăng ký 1 đội" />
      <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors">
        <Upload className="w-4 h-4" />
        Bulk import
      </button>
    </>
  )

  return (
    <>
      <PageHeader
        title="Đăng ký"
        description={`${totalCount} đăng ký · giải đã đóng cho VĐV mới. BTC có thể đăng ký hộ qua bulk import.`}
        actions={actions}
      />

      <PageBody
        previewSide="left"
        previewWidthPct={22}
        preview={
          <CategoryFilterPanel
            categories={categories}
            selected={selectedCats}
            counts={countByCat}
            totalCount={totalCount}
            onToggle={toggleCat}
            onClear={() => setSelectedCats(new Set())}
          />
        }
      >
        <div className="px-8 py-6">
          {/* Status tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
                  tab === t.key
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300',
                )}
              >
                {t.label}
                <span className="text-[11px] tabular-nums text-zinc-500">{countByStatus[t.key] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, CCCD, SĐT…"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            <FilterBtn icon={Filter} label="Hạng mục" />
            <FilterBtn icon={CreditCard} label="Thanh toán" />
          </div>

          {/* Bulk action bar */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-4 mt-4 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <span className="flex items-center gap-2 text-[13px] text-white">
                <span className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-sm" />
                </span>
                {selectedRows.size} đăng ký đã chọn
              </span>
              <BulkAction label="Approve tất cả" />
              <BulkAction label="Đánh dấu đã thu" />
              <BulkAction label="Từ chối" />
              <button
                onClick={() => setSelectedRows(new Set())}
                className="ml-auto flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Table */}
          <div className="mt-4">
            <RegistrationTable
              rows={rows}
              selected={selectedRows}
              allChecked={allChecked}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
            />
          </div>

          {/* Footer / pagination */}
          <div className="flex items-center justify-between mt-4 text-[12px] text-zinc-500">
            <span>Hiển thị {rows.length} trên {totalCount}</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-zinc-700 rounded-md text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
                ← Trước
              </button>
              <button className="px-3 py-1.5 border border-zinc-700 rounded-md text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                Tiếp →
              </button>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  )
}

// ─── Small buttons ──────────────────────────────────────────────────────────

function HeaderBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function FilterBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function BulkAction({ label }: { label: string }) {
  return (
    <button className="text-[13px] text-zinc-300 hover:text-white transition-colors">
      {label}
    </button>
  )
}
