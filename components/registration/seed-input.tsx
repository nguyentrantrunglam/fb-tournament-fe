'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSetSeed } from '@/lib/registrations/queries'

type Props = {
  tournamentId: string
  registrationId: string
  currentSeed: number | null
  disabled?: boolean
}

const inputCls = cn(
  'w-20 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5',
  'text-sm text-white text-center tabular-nums',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
)

export function SeedInput({ tournamentId, registrationId, currentSeed, disabled }: Props) {
  const [value, setValue] = useState<string>(currentSeed != null ? String(currentSeed) : '')
  const setSeed = useSetSeed(tournamentId)

  function commit() {
    const num = value.trim() === '' ? null : parseInt(value, 10)
    if (num !== null && (isNaN(num) || num < 1)) {
      setValue(currentSeed != null ? String(currentSeed) : '')
      return
    }
    if (num === currentSeed) return
    setSeed.mutate({ rid: registrationId, seed: num })
  }

  function clear() {
    setValue('')
    setSeed.mutate({ rid: registrationId, seed: null })
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="—"
        disabled={disabled || setSeed.isPending}
        className={cn(inputCls, (disabled || setSeed.isPending) && 'opacity-50 cursor-not-allowed')}
        aria-label="Seed"
      />
      {value !== '' && !disabled && (
        <button
          type="button"
          onClick={clear}
          disabled={setSeed.isPending}
          className="text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
          aria-label="Xoá seed"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
