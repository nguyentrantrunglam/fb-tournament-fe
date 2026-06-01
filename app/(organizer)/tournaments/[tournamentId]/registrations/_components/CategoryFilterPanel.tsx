'use client'

import { Check, ListFilter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryFilterOption } from '@/lib/types/registration'

type Props = {
  categories: CategoryFilterOption[]
  /** Set categoryId đang chọn — rỗng = tất cả */
  selected: Set<string>
  /** Số đăng ký mỗi nội dung (theo categoryId) */
  counts: Record<string, number>
  totalCount: number
  onToggle: (categoryId: string) => void
  onClear: () => void
}

export function CategoryFilterPanel({
  categories,
  selected,
  counts,
  totalCount,
  onToggle,
  onClear,
}: Props) {
  const allActive = selected.size === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          <ListFilter className="w-3.5 h-3.5" />
          Lọc theo nội dung
        </p>
        {!allActive && (
          <button
            onClick={onClear}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Xoá lọc
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {/* Tất cả */}
        <button
          onClick={onClear}
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left transition-colors',
            allActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
          )}
        >
          <span className="text-[13px] font-medium">Tất cả nội dung</span>
          <span className="text-[11px] tabular-nums text-zinc-500">{totalCount}</span>
        </button>

        {categories.map((cat) => {
          const isOn = selected.has(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => onToggle(cat.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors group',
                isOn ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                  isOn ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 group-hover:border-zinc-500',
                )}
              >
                {isOn && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-[11px] font-mono text-zinc-500 mr-1.5">{cat.code}</span>
                <span className="text-[13px] truncate">{cat.name}</span>
              </span>
              <span className="text-[11px] tabular-nums text-zinc-500">{counts[cat.id] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
