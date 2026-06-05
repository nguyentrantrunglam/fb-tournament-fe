'use client'

import { useState } from 'react'
import { Search, X, UserSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserSearch, useOrganizerUserSearch } from '@/lib/registrations/queries'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  /** 'organizer' uses the guarded endpoint that also searches by email prefix. */
  context?: 'organizer' | 'athlete'
}

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

function SearchDialog({
  open,
  onClose,
  tournamentId,
  genderFilter,
  excludeIds,
  context,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  tournamentId: string
  genderFilter: string | undefined
  excludeIds: string[]
  context: 'organizer' | 'athlete'
  onSelect: (user: SearchUsersResult) => void
}) {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)

  const athleteSearch = useUserSearch(tournamentId, debouncedQ, genderFilter)
  const organizerSearch = useOrganizerUserSearch(tournamentId, debouncedQ, genderFilter)
  const { data: results = [], isFetching } =
    context === 'organizer' ? organizerSearch : athleteSearch

  const filtered = results.filter((u) => !excludeIds.includes(u.id))

  function handleSelect(user: SearchUsersResult) {
    onSelect(user)
    setQ('')
    onClose()
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      setQ('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-zinc-800">
          <DialogTitle className="text-white text-sm">Chọn vận động viên</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative px-4 py-3 border-b border-zinc-800">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={context === 'organizer' ? 'Tìm tên hoặc email…' : 'Tìm tên VĐV…'}
            className={cn(
              'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 pl-9',
              'text-sm text-white placeholder:text-zinc-500',
              'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
            )}
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-72">
          {debouncedQ.trim().length < 2 ? (
            <p className="px-4 py-8 text-center text-[13px] text-zinc-600">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </p>
          ) : isFetching && filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-zinc-500">Đang tìm…</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-zinc-500">
              Không tìm thấy. Mời họ tạo account trước.
            </p>
          ) : (
            <ul>
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <span className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-zinc-300">
                          {u.displayName[0]?.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm text-white truncate block">{u.displayName}</span>
                      {u.gender && (
                        <span className="text-[11px] text-zinc-500">
                          {u.gender === 'male' ? 'Nam' : 'Nữ'}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PartnerPicker({
  tournamentId,
  primaryGender,
  genderRequirement,
  value,
  onChange,
  disabled,
  excludeIds = [],
  context = 'athlete',
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const genderFilter = deriveGenderFilter(genderRequirement, primaryGender)

  function clear() {
    onChange(null)
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md min-w-0">
        <span className="flex-1 text-sm text-white truncate">{value.displayName}</span>
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setPickerOpen(true)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'bg-zinc-800 border border-zinc-700 rounded-md',
          'text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600',
          'transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <UserSearch className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          {context === 'organizer' ? 'Chọn VĐV…' : 'Tìm VĐV…'}
        </span>
      </button>

      <SearchDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        tournamentId={tournamentId}
        genderFilter={genderFilter}
        excludeIds={excludeIds}
        context={context}
        onSelect={onChange}
      />
    </>
  )
}
