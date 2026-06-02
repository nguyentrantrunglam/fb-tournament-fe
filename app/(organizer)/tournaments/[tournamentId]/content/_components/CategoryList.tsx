'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Plus, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryCard } from './CategoryCard'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import type { CategoryWithStats, CategoryRegistrationStatus } from '@/lib/types/category'

// ─── Status filter options ─────────────────────────────────────────────────────

type FilterValue = CategoryRegistrationStatus | 'all'

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'not_open', label: 'Chưa mở' },
  { value: 'open',     label: 'Đang đăng ký' },
  { value: 'closed',   label: 'Đã đóng' },
]

// ─── Page description ─────────────────────────────────────────────────────────

function buildDescription(categories: CategoryWithStats[], canCreate: boolean): string {
  const n = categories.length
  const base = `${n} hạng mục`
  if (!canCreate) return `${base} · giải đã đóng đăng ký, không thể thêm hạng mục mới sau bốc thăm.`
  const open = categories.filter((c) => c.registrationStatus === 'open').length
  if (open > 0) return `${base} · ${open} hạng mục đang mở đăng ký.`
  return `${base} · chưa có hạng mục nào mở đăng ký.`
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
      <Layers className="w-9 h-9 mb-3 opacity-40" />
      <p className="text-sm font-medium text-zinc-500">
        {isFiltered ? 'Không tìm thấy hạng mục nào' : 'Chưa có hạng mục nào'}
      </p>
      {isFiltered ? (
        <button
          onClick={onClear}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors"
        >
          Xoá bộ lọc
        </button>
      ) : (
        <p className="mt-1 text-xs">Tạo hạng mục đầu tiên bằng nút &quot;+ Tạo hạng mục&quot;</p>
      )}
    </div>
  )
}

// ─── CategoryList ─────────────────────────────────────────────────────────────

type Props = {
  categories: CategoryWithStats[]
  tournamentId: string
  canCreate: boolean
  onChanged?: () => void
}

export function CategoryList({ categories, tournamentId, canCreate, onChanged }: Props) {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all')
  const [createOpen, setCreateOpen]   = useState(false)
  const [editing, setEditing]         = useState<CategoryWithStats | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return categories.filter((cat) => {
      const matchSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || cat.registrationStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [categories, search, statusFilter])

  const isFiltered = search !== '' || statusFilter !== 'all'
  const description = buildDescription(categories, canCreate)

  function handleEdit(id: string) {
    const cat = categories.find((c) => c.id === id)
    if (cat) setEditing(cat)
  }

  function handleLifecycleAction(id: string, action: 'open' | 'close') {
    // TODO: gọi CF open-registration / close-registration khi Phase 3 xong
    console.log('lifecycle', id, action)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header row (cố định) ── */}
      <div className="flex-shrink-0 flex items-start justify-between gap-6 px-8 pt-7 pb-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-white leading-tight">
            Nội dung · Hạng mục
          </h1>
          <p className="text-[13px] text-zinc-400 mt-1 leading-snug">{description}</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo mã / tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-52 bg-zinc-900 border rounded-md pl-8 pr-3 py-2',
                'text-sm text-white placeholder:text-zinc-600',
                'focus:outline-none transition-colors',
                search
                  ? 'border-zinc-600'
                  : 'border-zinc-800 hover:border-zinc-700 focus:border-zinc-600',
              )}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterValue)}
              className={cn(
                'appearance-none bg-zinc-900 border rounded-md pl-3 pr-8 py-2',
                'text-sm focus:outline-none cursor-pointer transition-colors',
                statusFilter !== 'all'
                  ? 'border-zinc-600 text-white'
                  : 'border-zinc-800 hover:border-zinc-700 text-zinc-400',
              )}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Create button */}
          <button
            onClick={() => canCreate && setCreateOpen(true)}
            disabled={!canCreate}
            title={!canCreate ? 'Không thể thêm hạng mục sau khi bốc thăm' : undefined}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              canCreate
                ? 'bg-orange-500 hover:bg-orange-400 text-white'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo hạng mục
          </button>
        </div>
      </div>

      {/* ── Category list (scroll) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-7 pt-5">
        {filtered.length === 0 ? (
          <EmptyState
            isFiltered={isFiltered}
            onClear={() => { setSearch(''); setStatusFilter('all') }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleEdit}
                onLifecycleAction={handleLifecycleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit dialog ── */}
      <CreateCategoryDialog
        open={createOpen || editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false)
            setEditing(null)
          }
        }}
        tournamentId={tournamentId}
        editing={editing}
        onCreated={onChanged}
      />
    </div>
  )
}
