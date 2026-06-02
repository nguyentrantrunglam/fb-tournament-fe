import { CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TournamentStatus } from '@/lib/types/tournament'

const STATUS: Record<TournamentStatus, { label: string; cls: string; dot: string; pulse: boolean }> = {
  draft: { label: 'Bản nháp', cls: 'bg-zinc-700/60 text-zinc-300', dot: 'bg-zinc-400', pulse: false },
  open: { label: 'Đang đăng ký', cls: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-400', pulse: false },
  running: { label: 'Đang vận hành', cls: 'bg-orange-500/20 text-orange-300', dot: 'bg-orange-500', pulse: true },
  completed: { label: 'Đã kết thúc', cls: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400', pulse: false },
  cancelled: { label: 'Đã huỷ', cls: 'bg-zinc-700/60 text-zinc-400', dot: 'bg-zinc-500', pulse: false },
}

function fmtRange(a: string | null | undefined, b: string | null | undefined): string {
  const d = (s: string) => s.split('-').reverse().slice(0, 2).join('.')
  if (!a) return ''
  return b ? `${d(a)} — ${d(b)}` : d(a)
}

type Props = {
  name: string
  location?: string
  startDate?: string | null
  endDate?: string | null
  status: TournamentStatus
  bannerUrl?: string | null
  logoUrl?: string | null
  /** Nội dung phụ hiển thị dưới banner (chip hạng mục, nhà tài trợ…) */
  children?: React.ReactNode
}

// Thẻ giải kiểu hero: banner 2:1, thông tin đè + lớp tối mờ. Dùng chung preview + list.
export function TournamentHeroCard({
  name,
  location,
  startDate,
  endDate,
  status,
  bannerUrl,
  logoUrl,
  children,
}: Props) {
  const st = STATUS[status] ?? STATUS.draft
  const range = fmtRange(startDate, endDate)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="relative aspect-[2/1] bg-gradient-to-br from-zinc-800 to-zinc-900">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        <span className={cn('absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm', st.cls)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', st.dot, st.pulse && 'animate-pulse')} />
          {st.label}
        </span>

        {/* Logo bên trái + thông tin (tên / ngày / địa điểm) bên phải */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-end gap-2.5">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="w-12 h-12 rounded-md object-cover border border-white/20 bg-black/30 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-white leading-snug line-clamp-2 drop-shadow">{name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-zinc-200/90 drop-shadow">
              {range && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {range}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {children && <div className="p-3.5">{children}</div>}
    </div>
  )
}
