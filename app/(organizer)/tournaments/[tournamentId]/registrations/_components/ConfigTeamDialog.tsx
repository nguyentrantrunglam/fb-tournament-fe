'use client'

import { cn } from '@/lib/utils'
import { SeedInput } from '@/components/registration/seed-input'
import { TeamPhotoUploader } from '@/components/registration/team-photo-uploader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { RegistrationRow } from '@/lib/types/registration'

type Props = {
  open: boolean
  onClose: () => void
  tournamentId: string
  /** Only approved registrations of a closed category should be passed here. */
  registrations: RegistrationRow[]
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

export function ConfigTeamDialog({ open, onClose, tournamentId, registrations }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[640px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Config đội — seed &amp; ảnh</DialogTitle>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            {registrations.length} đội approved · Seed chỉ validate khi bốc thăm
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
          {registrations.length === 0 && (
            <p className="text-[13px] text-zinc-500 py-6 text-center">
              Chưa có đội approved trong hạng mục này.
            </p>
          )}
          {registrations.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 px-4 py-3 rounded-lg bg-zinc-800/60 border border-zinc-800"
            >
              {/* Avatar */}
              <span className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none',
                'bg-zinc-700 text-zinc-300',
              )}>
                {initials(r.athleteName)}
              </span>

              {/* Name + partner */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{r.athleteName}</p>
                {r.partnerName && (
                  <p className="text-[11px] text-zinc-500 truncate">+ {r.partnerName}</p>
                )}
              </div>

              {/* Seed */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Seed</span>
                <SeedInput
                  tournamentId={tournamentId}
                  registrationId={r.id}
                  currentSeed={r.seed}
                />
              </div>

              {/* Team photo */}
              <TeamPhotoUploader
                tournamentId={tournamentId}
                registrationId={r.id}
                currentPhotoUrl={r.teamPhotoUrl}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 bg-zinc-900 border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm bg-orange-500 hover:bg-orange-400 text-white font-medium transition-colors"
          >
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
