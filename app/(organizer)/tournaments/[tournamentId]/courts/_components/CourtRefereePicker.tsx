'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RefereeOption } from '@/lib/types/court'

type Props = {
  referees: RefereeOption[]
  selectedUid: string | null
  hasConflict: boolean
  onSelect: (uid: string | null) => void
}

export function CourtRefereePicker({ referees, selectedUid, hasConflict, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = referees.find((r) => r.uid === selectedUid) ?? null

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
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border text-left transition-colors',
          'bg-zinc-800/60 hover:bg-zinc-800',
          hasConflict ? 'border-amber-700/70' : 'border-zinc-700',
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">
              {selected.tag}
            </span>
            <span className="text-[13px] text-white truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[13px] text-zinc-500">
            <UserX className="w-3.5 h-3.5" />
            Chưa gán trọng tài
          </span>
        )}
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-zinc-500 flex-shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-64 overflow-y-auto">
          {referees.map((r) => {
            const isSel = r.uid === selectedUid
            return (
              <button
                key={r.uid}
                type="button"
                onClick={() => {
                  onSelect(r.uid)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/60 transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">
                  {r.tag}
                </span>
                <span className="text-[13px] text-white flex-1 truncate">{r.name}</span>
                {isSel && <Check className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
              </button>
            )
          })}
          {selectedUid && (
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-300 transition-colors border-t border-zinc-700/60 mt-1"
            >
              <UserX className="w-3.5 h-3.5" />
              <span className="text-[13px]">Bỏ gán trọng tài</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
