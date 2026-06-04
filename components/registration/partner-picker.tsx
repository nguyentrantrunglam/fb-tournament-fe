'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserSearch } from '@/lib/registrations/queries'
import type { GenderRequirement } from '@/lib/types/category'
import type { SearchUsersResult } from '@/lib/registrations/client'

type Props = {
  tournamentId: string
  /** Gender of the primary athlete — used to derive gender filter for mixed_pair. */
  primaryGender?: 'male' | 'female' | null
  genderRequirement: GenderRequirement
  value: SearchUsersResult | null
  onChange: (user: SearchUsersResult | null) => void
  disabled?: boolean
  /** User IDs to exclude from results (e.g. the primary athlete). */
  excludeIds?: string[]
}

/**
 * Derives the gender filter string passed to the search API based on the
 * category gender requirement and the primary athlete's gender.
 * - men_only       → male only
 * - women_only     → female only
 * - mixed_pair     → opposite of primary gender
 * - unrestricted   → no filter
 */
function deriveGenderFilter(
  req: GenderRequirement,
  primaryGender?: 'male' | 'female' | null,
): string | undefined {
  if (req === 'men_only') return 'male'
  if (req === 'women_only') return 'female'
  if (req === 'mixed_pair') {
    if (primaryGender === 'male') return 'female'
    if (primaryGender === 'female') return 'male'
  }
  return undefined
}

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 pl-8',
  'text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

export function PartnerPicker({
  tournamentId,
  primaryGender,
  genderRequirement,
  value,
  onChange,
  disabled,
  excludeIds = [],
}: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const genderFilter = deriveGenderFilter(genderRequirement, primaryGender)
  const { data: results = [] } = useUserSearch(tournamentId, q, genderFilter)

  const filtered = results.filter((u) => !excludeIds.includes(u.id))

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(user: SearchUsersResult) {
    onChange(user)
    setQ('')
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setQ('')
  }

  // Show the selected user as a chip
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md">
        <span className="flex-1 text-sm text-white truncate">{value.displayName}</span>
        {!disabled && (
          <button type="button" onClick={clear} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
        placeholder="Tìm tên VĐV…"
        className={inputCls}
        disabled={disabled}
        autoComplete="off"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute z-40 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-zinc-500">
              Không tìm thấy. Mời họ tạo account trước.
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => select(u)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/60 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-zinc-600 flex-shrink-0 overflow-hidden">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {u.displayName[0]?.toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-[13px] text-white truncate block">{u.displayName}</span>
                  {u.gender && (
                    <span className="text-[11px] text-zinc-500">
                      {u.gender === 'male' ? 'Nam' : 'Nữ'}
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
