'use client'

import { useEffect, useRef, useState } from 'react'
import { Filter, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryFilterOption } from '@/lib/types/registration'

type Props = {
  categories: CategoryFilterOption[]
  selected: Set<string>
  counts: Record<string, number>
  onToggle: (id: string) => void
  onClear: () => void
}

// Filter "Nội dung" gói trong 1 nút dropdown (đa chọn) trên toolbar.
export function CategoryFilterDropdown({ categories, selected, counts, onToggle, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = selected.size

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md transition-colors',
          count > 0
            ? 'border-orange-500/60 text-white'
            : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500',
        )}
      >
        <Filter className="w-3.5 h-3.5" />
        Nội dung
        {count > 0 && (
          <span className="text-[10px] bg-orange-500 text-white rounded-full px-1.5 tabular-nums">{count}</span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-60 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl">
          {categories.map((c) => {
            const on = selected.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggle(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/60 transition-colors"
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded flex items-center justify-center border flex-shrink-0',
                    on ? 'bg-orange-500 border-orange-500' : 'border-zinc-600',
                  )}
                >
                  {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono text-zinc-500 mr-1.5">{c.code}</span>
                  <span className="text-[13px] text-white">{c.name}</span>
                </span>
                <span className="text-[11px] tabular-nums text-zinc-500">{counts[c.id] ?? 0}</span>
              </button>
            )
          })}
          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full text-left px-3 py-2 text-[12px] text-zinc-500 hover:text-zinc-300 border-t border-zinc-700/60 mt-1"
            >
              Xoá lọc nội dung
            </button>
          )}
        </div>
      )}
    </div>
  )
}
