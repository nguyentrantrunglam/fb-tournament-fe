'use client'

import { cn } from '@/lib/utils'
import { SeedInput } from '@/components/registration/seed-input'
import { TeamPhotoUploader } from '@/components/registration/team-photo-uploader'
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

type Props = {
  team: TeamEntry
  tournamentId: string
}

export function TeamCard({ team, tournamentId }: Props) {
  const names = team.players.map((p) => p.name).join(' / ')

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Player identities */}
      <div className="p-3 border-b border-zinc-800">
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
      </div>

      {/* Seed + photo controls */}
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-500 w-10 shrink-0">Seed</span>
          <SeedInput
            tournamentId={tournamentId}
            registrationId={team.id}
            currentSeed={team.seed}
          />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[12px] text-zinc-500 w-10 shrink-0 pt-1.5">Ảnh</span>
          <TeamPhotoUploader
            tournamentId={tournamentId}
            registrationId={team.id}
            currentPhotoUrl={team.teamPhotoUrl}
          />
        </div>
      </div>
    </div>
  )
}
