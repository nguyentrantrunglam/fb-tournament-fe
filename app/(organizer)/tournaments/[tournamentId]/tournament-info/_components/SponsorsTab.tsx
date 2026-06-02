'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Plus, X, Link2, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateTournament, uploadTournamentImage } from '@/lib/tournaments/api'
import { authErrorMessage } from '@/lib/auth/auth-error'
import type { TournamentSponsor, SponsorTier } from '@/lib/types/tournament'

type SponsorItem = TournamentSponsor

const TIERS: { key: SponsorTier; label: string; dot: string }[] = [
  { key: 'diamond', label: 'Kim cương', dot: 'bg-cyan-300' },
  { key: 'gold', label: 'Vàng', dot: 'bg-amber-400' },
  { key: 'silver', label: 'Bạc', dot: 'bg-zinc-300' },
  { key: 'operator', label: 'Đơn vị vận hành', dot: 'bg-orange-400' },
  { key: 'media', label: 'Bảo trợ truyền thông', dot: 'bg-violet-400' },
]

const inputCls = cn(
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-[13px] text-white placeholder:text-zinc-600',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
)

function SponsorCard({
  s,
  uploading,
  onChange,
  onUploadLogo,
  onRemove,
}: {
  s: SponsorItem
  uploading: boolean
  onChange: (patch: Partial<SponsorItem>) => void
  onUploadLogo: (file: File) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-20 h-20 flex-shrink-0 rounded-md border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center overflow-hidden bg-zinc-950/40 transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        ) : s.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain p-1.5" />
        ) : (
          <ImagePlus className="w-5 h-5 text-zinc-600" />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadLogo(f)
          }}
        />
      </button>

      <div className="flex-1 min-w-0 space-y-1.5">
        <input value={s.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Tên nhà tài trợ" className={inputCls} />
        <div className="relative">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input value={s.link} onChange={(e) => onChange({ link: e.target.value })} placeholder="https://..." className={cn(inputCls, 'pl-8')} />
        </div>
        <textarea value={s.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Mô tả ngắn (tuỳ chọn)" rows={2} className={cn(inputCls, 'resize-none')} />
      </div>

      <button onClick={onRemove} className="p-1 text-zinc-600 hover:text-red-400 transition-colors self-start">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function SponsorsTab({ tournamentId, initialSponsors }: { tournamentId: string; initialSponsors: SponsorItem[] }) {
  const [sponsors, setSponsors] = useState<SponsorItem[]>(initialSponsors)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  function addSponsor(tier: SponsorTier) {
    setSponsors((prev) => [...prev, { id: crypto.randomUUID(), tier, name: '', logoUrl: null, link: '', description: '' }])
  }
  function updateSponsor(id: string, patch: Partial<SponsorItem>) {
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function removeSponsor(id: string) {
    setSponsors((prev) => prev.filter((s) => s.id !== id))
  }
  async function uploadLogo(id: string, file: File) {
    setUploadingId(id)
    setErr(null)
    try {
      const url = await uploadTournamentImage(tournamentId, 'sponsor', file)
      updateSponsor(id, { logoUrl: url })
    } catch (e) {
      setErr(authErrorMessage(e))
    } finally {
      setUploadingId(null)
    }
  }
  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await updateTournament(tournamentId, { sponsors })
    } catch (e) {
      setErr(authErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-zinc-500">Phân bậc nhà tài trợ. Logo upload trực tiếp; bấm Lưu để cập nhật.</p>
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            saving ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-white',
          )}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu nhà tài trợ'}
        </button>
      </div>

      {err && <div className="text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{err}</div>}

      {TIERS.map((tier) => {
        const items = sponsors.filter((s) => s.tier === tier.key)
        return (
          <section key={tier.key}>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-white">
                <span className={cn('w-2 h-2 rounded-full', tier.dot)} />
                {tier.label}
                <span className="text-[11px] text-zinc-500 tabular-nums">{items.length}</span>
              </h2>
              <button
                onClick={() => addSponsor(tier.key)}
                className="flex items-center gap-1 text-[12px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-2.5 py-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-[12px] text-zinc-600 italic px-1 py-2">Chưa có nhà tài trợ bậc này.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map((s) => (
                  <SponsorCard
                    key={s.id}
                    s={s}
                    uploading={uploadingId === s.id}
                    onChange={(patch) => updateSponsor(s.id, patch)}
                    onUploadLogo={(file) => uploadLogo(s.id, file)}
                    onRemove={() => removeSponsor(s.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
