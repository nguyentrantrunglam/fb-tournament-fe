'use client'

import { ImagePlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamEntry } from '@/lib/types/team'

const AVATAR_PALETTE = [
  'bg-amber-700 text-amber-100', 'bg-teal-700 text-teal-100',
  'bg-blue-800 text-blue-100', 'bg-violet-800 text-violet-100',
  'bg-rose-800 text-rose-100', 'bg-cyan-800 text-cyan-100',
]

function avatarColor(seed: string): string {
  const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]!
}

// Nền sọc chéo cho vùng ảnh chưa upload
const STRIPE_BG: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 8px, transparent 8px 16px)',
}

export function TeamCard({ team, onUpload }: { team: TeamEntry; onUpload: (id: string) => void }) {
  const names = team.players.map((p) => p.name).join(' / ')

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Vùng ảnh đội */}
      <button
        onClick={() => onUpload(team.id)}
        style={STRIPE_BG}
        className={cn(
          'relative w-full h-28 flex items-center justify-center group',
          team.photoUploaded ? 'bg-emerald-950/40' : 'bg-zinc-800/40',
        )}
      >
        {/* Nhãn trạng thái ảnh */}
        <span
          className={cn(
            'absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md',
            team.photoUploaded ? 'text-emerald-300 bg-emerald-950/80' : 'text-zinc-400 bg-zinc-900/70',
          )}
        >
          {team.photoUploaded ? <Check className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
          {team.photoUploaded ? 'ảnh tự upload' : 'Upload ảnh đội'}
        </span>

        {/* Seed badge */}
        <span
          className={cn(
            'absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-[15px] font-bold tabular-nums',
            team.seed !== null ? 'bg-zinc-950 text-white' : 'bg-zinc-900/70 text-zinc-600',
          )}
        >
          {team.seed ?? '–'}
        </span>
      </button>

      {/* Thông tin đội */}
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          {team.players.map((p, i) => (
            <span
              key={i}
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold select-none',
                avatarColor(p.initials),
              )}
            >
              {p.initials}
            </span>
          ))}
        </div>
        <p className="text-[14px] font-semibold text-white mt-2 truncate">{names}</p>
        <p className={cn('text-[12px] mt-0.5', team.clubName ? 'text-zinc-500' : 'text-zinc-600 italic')}>
          {team.clubName ?? 'Indep.'}
        </p>
      </div>
    </div>
  )
}
