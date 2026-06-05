'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, CheckCircle2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { presignTeamPhoto } from '@/lib/registrations/client'
import { useSetTeamPhoto } from '@/lib/registrations/queries'

const MAX_BYTES = 1 * 1024 * 1024 // 1 MB after compression

type Props = {
  tournamentId: string
  registrationId: string
  currentPhotoUrl: string | null
  disabled?: boolean
  /** compact=true: ảnh nhỏ hơn (10×10) dùng trong table row */
  compact?: boolean
}

/**
 * Compresses an image file to ≤ maxBytes using an off-screen canvas.
 * Iterates quality from 0.85 down to 0.3; falls back to the original if still too large.
 */
async function compressImage(file: File, maxBytes: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      // Scale down if image is very large (max dimension 1200px)
      const maxDim = 1200
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim }
        else { width = Math.round((width / height) * maxDim); height = maxDim }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Iteratively reduce quality until under maxBytes
      let quality = 0.85
      function tryQuality() {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            if (blob.size <= maxBytes || quality <= 0.3) { resolve(blob); return }
            quality -= 0.1
            tryQuality()
          },
          'image/jpeg',
          quality,
        )
      }
      tryQuality()
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export function TeamPhotoUploader({
  tournamentId,
  registrationId,
  currentPhotoUrl,
  disabled,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setTeamPhoto = useSetTeamPhoto(tournamentId)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh')
      return
    }
    setError(null)
    setUploading(true)
    try {
      // Compress to ≤1 MB before upload
      const compressed = await compressImage(file, MAX_BYTES)
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const contentType = 'image/jpeg'

      const { uploadUrl, publicUrl } = await presignTeamPhoto(
        tournamentId,
        registrationId,
        ext,
        contentType,
      )

      // PUT directly to Spaces (presigned URL is self-authenticating — no auth header needed)
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: compressed,
      })
      if (!putRes.ok) throw new Error(`Upload thất bại: ${putRes.status}`)

      await setTeamPhoto.mutateAsync({ rid: registrationId, url: publicUrl })
    } catch (e) {
      setError((e as Error).message ?? 'Upload thất bại')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (compact) {
    // Table-cell mode: always show preview (or placeholder), click to change
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          disabled={disabled || uploading}
          title={currentPhotoUrl ? 'Đổi ảnh đội' : 'Tải ảnh đội'}
          className="group relative w-14 h-14 rounded-md overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors disabled:opacity-50 shrink-0"
        >
          {currentPhotoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentPhotoUrl} alt="Ảnh đội" className="w-full h-full object-cover" />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading
                  ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              {uploading
                ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                : <ImagePlus className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
            </div>
          )}
        </button>
        {error && <p className="text-[10px] text-red-400 text-center leading-tight max-w-[56px]">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>
    )
  }

  const imgCls = 'w-16 h-16 rounded-md object-cover border border-zinc-700'

  return (
    <div className="flex flex-col gap-1.5">
      {/* Preview */}
      {currentPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentPhotoUrl}
          alt="Ảnh đội"
          className={imgCls}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border transition-colors',
            disabled || uploading
              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500',
          )}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          {uploading ? 'Đang tải…' : currentPhotoUrl ? 'Đổi ảnh' : 'Tải ảnh đội'}
        </button>

        {setTeamPhoto.isSuccess && !uploading && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        )}
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
