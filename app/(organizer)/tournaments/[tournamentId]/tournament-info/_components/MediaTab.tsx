'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateTournament, uploadTournamentImage } from '@/lib/tournaments/api'
import { authErrorMessage } from '@/lib/auth/auth-error'

function UploadBox({
  url,
  uploading,
  onPick,
  onClear,
  aspect,
  title,
  hint,
}: {
  url: string | null
  uploading: boolean
  onPick: (file: File) => void
  onClear: () => void
  aspect: string
  title: string
  hint: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div>
      <p className="text-[13px] text-zinc-300 font-medium mb-1.5">{title}</p>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onPick(f)
        }}
        className={cn(
          'relative w-full rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden transition-colors',
          aspect,
          dragOver ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/40',
        )}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 text-zinc-500 animate-spin" />
        ) : url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              className="absolute top-2 right-2 p-1 rounded-md bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <ImagePlus className="w-7 h-7 text-zinc-600" />
            <p className="text-[13px] text-zinc-400">
              Kéo thả hoặc <span className="text-orange-400 underline">chọn từ máy</span>
            </p>
            <p className="text-[11px] text-zinc-600 font-mono">{hint}</p>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPick(f)
          }}
        />
      </div>
    </div>
  )
}

export function MediaTab({
  tournamentId,
  initialBanner,
  initialLogo,
}: {
  tournamentId: string
  initialBanner: string | null
  initialLogo: string | null
}) {
  const [banner, setBanner] = useState<string | null>(initialBanner)
  const [logo, setLogo] = useState<string | null>(initialLogo)
  const [busy, setBusy] = useState<'banner' | 'logo' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function pick(kind: 'banner' | 'logo', file: File) {
    setBusy(kind)
    setErr(null)
    try {
      const url = await uploadTournamentImage(tournamentId, kind, file)
      await updateTournament(tournamentId, kind === 'banner' ? { bannerUrl: url } : { logoUrl: url })
      if (kind === 'banner') setBanner(url)
      else setLogo(url)
    } catch (e) {
      setErr(authErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  async function clear(kind: 'banner' | 'logo') {
    setErr(null)
    try {
      await updateTournament(tournamentId, kind === 'banner' ? { bannerUrl: null } : { logoUrl: null })
      if (kind === 'banner') setBanner(null)
      else setLogo(null)
    } catch (e) {
      setErr(authErrorMessage(e))
    }
  }

  return (
    <div className="px-8 py-6 space-y-6">
      {err && <div className="text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{err}</div>}

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <h2 className="text-[13px] font-semibold text-zinc-300">Banner giải</h2>
        <UploadBox
          url={banner}
          uploading={busy === 'banner'}
          onPick={(f) => pick('banner', f)}
          onClear={() => clear('banner')}
          aspect="aspect-[2/1]"
          title="Ảnh banner trang public"
          hint="2000 × 1000 px · tỉ lệ 2:1 · PNG/JPG"
        />
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-[13px] font-semibold text-zinc-300 mb-4">Logo giải</h2>
        <div className="max-w-[220px]">
          <UploadBox
            url={logo}
            uploading={busy === 'logo'}
            onPick={(f) => pick('logo', f)}
            onClear={() => clear('logo')}
            aspect="aspect-square"
            title="Logo (hình vuông)"
            hint="512 × 512 px · nền trong suốt"
          />
        </div>
      </section>
    </div>
  )
}
