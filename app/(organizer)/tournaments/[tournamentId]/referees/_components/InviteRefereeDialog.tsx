'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBatchInviteReferee } from '@/lib/referees/queries'
import { searchUsers, type SearchUserResult } from '@/lib/referees/client'

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-zinc-300">
      {initials || '?'}
    </div>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function InviteRefereeDialog({ open, onOpenChange, tournamentId }: Props) {
  const invite = useBatchInviteReferee(tournamentId)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Map<string, SearchUserResult>>(new Map())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) { setResults([]); setSearching(false); return }

    setSearching(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const users = await searchUsers(tournamentId, q)
      setResults(users)
      setSearching(false)
    }, 400)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, tournamentId, open])

  function handleClose() {
    onOpenChange(false)
    setQuery('')
    setResults([])
    setSelected(new Map())
    invite.reset()
  }

  function toggleSelect(user: SearchUserResult) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(user.uid)) next.delete(user.uid)
      else next.set(user.uid, user)
      return next
    })
  }

  function removeSelected(uid: string) {
    setSelected((prev) => {
      const next = new Map(prev)
      next.delete(uid)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    try {
      await invite.mutateAsync([...selected.keys()])
      handleClose()
    } catch {
      // toast hiện bởi MutationCache.onError trong QueryProvider
    }
  }

  const selectedList = [...selected.values()]
  const isPending = invite.isPending
  const showEmpty = query.trim().length >= 2 && !searching && results.length === 0
  const showHint  = query.trim().length < 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-zinc-800">
          <DialogTitle className="text-white text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-orange-400" />
            Mời trọng tài
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              autoFocus
              className={cn(
                'w-full bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-8 py-2',
                'text-sm text-white placeholder:text-zinc-500',
                'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
                'transition-colors',
              )}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 animate-spin" />
            )}
            {!searching && query && (
              <button
                onClick={() => { setQuery(''); setResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="mx-5 mb-3 rounded-lg border border-zinc-800 overflow-hidden min-h-[120px] max-h-[240px] overflow-y-auto">
          {showHint && (
            <div className="flex items-center justify-center h-[120px] text-[13px] text-zinc-600">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          )}
          {searching && results.length === 0 && (
            <div className="flex items-center justify-center h-[120px]">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          )}
          {showEmpty && (
            <div className="flex items-center justify-center h-[120px] text-[13px] text-zinc-600">
              Không tìm thấy người dùng
            </div>
          )}
          {results.map((user) => {
            const isSelected = selected.has(user.uid)
            return (
              <button
                key={user.uid}
                onClick={() => toggleSelect(user)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'border-b border-zinc-800/60 last:border-b-0',
                  isSelected
                    ? 'bg-orange-500/10 hover:bg-orange-500/15'
                    : 'hover:bg-zinc-800/60',
                )}
              >
                <Avatar name={user.displayName} avatarUrl={user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white leading-tight truncate">
                    {user.displayName || '(Chưa đặt tên)'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    {[user.email, user.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                  isSelected
                    ? 'bg-orange-500 border-orange-500'
                    : 'border-zinc-600',
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected chips */}
        {selectedList.length > 0 && (
          <div className="mx-5 mb-3">
            <p className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">
              Đã chọn ({selectedList.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedList.map((user) => (
                <span
                  key={user.uid}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-full text-[12px] text-zinc-200"
                >
                  {user.displayName || user.uid.slice(0, 6)}
                  <button
                    onClick={() => removeSelected(user.uid)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || isPending}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-[120px]',
              selected.size === 0 || isPending
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-white',
            )}
          >
            {isPending
              ? 'Đang thêm...'
              : selected.size > 0
                ? `Thêm ${selected.size} trọng tài`
                : 'Chọn trọng tài'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
