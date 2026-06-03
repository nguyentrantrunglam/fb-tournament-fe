'use client'

import { useRef, useState } from 'react'
import { QrCode, Info, ShieldCheck, AlertTriangle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadTournamentImage } from '@/lib/tournaments/api'

type Props = {
  tournamentId: string
  qrUrl: string | null
  isPublic: boolean
  onChange: (url: string | null) => void
}

const NOTES = [
  {
    icon: Info,
    cls: 'text-zinc-500',
    node: (isPublic: boolean) => (
      <>
        Khán giả &amp; VĐV xem QR ở trang giải public sau{' '}
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium',
            isPublic ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500',
          )}
        >
          isPublic
        </span>{' '}
        khi bật.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    cls: 'text-zinc-500',
    node: () => <>QR không tự gen từ STK ở MVP — bạn upload ảnh từ app ngân hàng.</>,
  },
  {
    icon: AlertTriangle,
    cls: 'text-amber-500',
    node: () => (
      <>Đổi QR giữa giải: ảnh cũ vẫn cached ở khán giả — báo trước trong notification.</>
    ),
  },
]

export function QrUploader({ tournamentId, qrUrl, isPublic, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const downloadUrl = await uploadTournamentImage(tournamentId, 'sponsor', file)
      onChange(downloadUrl)
    } catch {
      // upload thất bại — giữ nguyên qrUrl cũ, không thông báo (người dùng thấy ảnh chưa đổi)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-[15px] font-semibold text-white">Mã QR thanh toán</h2>
        <span className="text-[11px] text-zinc-600 font-mono">khuyến nghị VietQR · 600×600px</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Drop zone */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'relative aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden',
            uploading ? 'cursor-wait border-zinc-700 bg-zinc-950/40' :
            dragOver ? 'cursor-pointer border-orange-500 bg-orange-500/5' :
            'cursor-pointer border-zinc-700 hover:border-zinc-500 bg-zinc-950/40',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-7 h-7 text-zinc-500 animate-spin" />
              <p className="text-[12px] text-zinc-500">Đang tải lên...</p>
            </>
          ) : qrUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR thanh toán" className="absolute inset-0 w-full h-full object-contain p-4" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
                className="absolute top-2 right-2 p-1 rounded-md bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <QrCode className="w-8 h-8 text-zinc-600" />
              <p className="text-[13px] text-zinc-400 text-center px-4">
                Kéo thả ảnh QR hoặc <span className="text-orange-400 underline">chọn từ máy</span>
              </p>
              <p className="text-[11px] text-zinc-600 font-mono">PNG · 600×600</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* Notes */}
        <ul className="flex flex-col gap-3 justify-center">
          {NOTES.map(({ icon: Icon, cls, node }, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-zinc-400 leading-relaxed">
              <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cls)} />
              <span>{node(isPublic)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
