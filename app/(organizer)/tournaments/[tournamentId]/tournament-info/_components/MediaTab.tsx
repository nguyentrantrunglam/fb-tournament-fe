'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function UploadBox({
  url,
  onChange,
  aspect,
  title,
  hint,
}: {
  url: string | null
  onChange: (url: string | null) => void
  aspect: string // tailwind aspect class
  title: string
  hint: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function pick(file?: File) {
    if (file) onChange(URL.createObjectURL(file))
  }

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
          pick(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'relative w-full rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden transition-colors',
          aspect,
          dragOver ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/40',
        )}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
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
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}

export function MediaTab() {
  const [banner, setBanner] = useState<string | null>(null)
  const [logo, setLogo] = useState<string | null>(null)

  return (
    <div className="px-8 py-6 space-y-6">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <h2 className="text-[13px] font-semibold text-zinc-300">Banner giải</h2>
        <UploadBox
          url={banner}
          onChange={setBanner}
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
            onChange={setLogo}
            aspect="aspect-square"
            title="Logo (hình vuông)"
            hint="512 × 512 px · nền trong suốt"
          />
        </div>
      </section>
    </div>
  )
}
