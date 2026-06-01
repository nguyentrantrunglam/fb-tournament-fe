import Link from 'next/link'
import { Compass, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** Tiêu đề chính */
  title?: string
  /** Mô tả phụ */
  description?: string
  /** Link CTA quay về */
  backHref: string
  backLabel: string
  /** Bọc full màn hình (global 404) hay chỉ điền khu vực nội dung (trong chrome) */
  fullscreen?: boolean
}

export function NotFoundView({
  title = 'Không tìm thấy màn hình',
  description = 'Màn hình bạn tìm không tồn tại hoặc chưa được xây dựng trong hệ thống.',
  backHref,
  backLabel,
  fullscreen = false,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6',
        fullscreen ? 'min-h-screen bg-zinc-950 text-white' : 'py-24',
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 text-zinc-600" />
      </div>

      <p className="text-[64px] font-bold leading-none text-zinc-800 tabular-nums select-none">404</p>

      <h1 className="text-[20px] font-bold text-white mt-4">{title}</h1>
      <p className="text-[13px] text-zinc-400 mt-2 max-w-sm leading-relaxed">{description}</p>

      <Link
        href={backHref}
        className="mt-7 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
    </div>
  )
}
