'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Settings, FileText, UserCheck,
  MapPin, CreditCard, Users, ListOrdered,
  GitFork, CalendarDays, Radio, ChevronDown,
} from 'lucide-react'
import type { Tournament, TournamentStatus } from '@/lib/types/tournament'

const STATUS_CONFIG: Record<TournamentStatus, { label: string; dot: string }> = {
  draft:     { label: 'Bản nháp',      dot: 'bg-zinc-400' },
  open:      { label: 'Đang đăng ký',  dot: 'bg-blue-500' },
  running:   { label: 'Đang vận hành', dot: 'bg-orange-500' },
  completed: { label: 'Đã kết thúc',   dot: 'bg-zinc-500' },
  cancelled: { label: 'Đã huỷ',        dot: 'bg-red-500' },
}

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

type NavSection = { title: string; items: NavItem[] }

// Badge counts — thay bằng data thật từ Firestore khi có
const MOCK_COUNTS = { content: 5, referees: 4, courts: 3, registrations: 72, teams: 65 }

export function TournamentSidebar({
  tournamentId,
  tournament,
}: {
  tournamentId: string
  tournament: Tournament
}) {
  const pathname = usePathname()
  const base = `/tournaments/${tournamentId}`

  const sections: NavSection[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { label: 'Tổng quan giải', href: `${base}`, icon: LayoutDashboard },
      ],
    },
    {
      title: 'S1 · CẤU HÌNH',
      items: [
        { label: 'Thông tin giải',  href: `${base}/tournament-info`, icon: Settings },
        { label: 'Nội dung',        href: `${base}/content`,         icon: FileText,  badge: MOCK_COUNTS.content },
        { label: 'Trọng tài',       href: `${base}/referees`,        icon: UserCheck, badge: MOCK_COUNTS.referees },
        { label: 'Sân thi đấu',     href: `${base}/courts`,          icon: MapPin,    badge: MOCK_COUNTS.courts },
        { label: 'Lệ phí & QR',     href: `${base}/fees`,            icon: CreditCard },
      ],
    },
    {
      title: 'S2 · ĐĂNG KÝ',
      items: [
        { label: 'Đăng ký',      href: `${base}/registrations`, icon: Users,       badge: MOCK_COUNTS.registrations },
        { label: 'Danh sách đội', href: `${base}/teams`,         icon: ListOrdered, badge: MOCK_COUNTS.teams },
      ],
    },
    {
      title: 'S3 · BỐC THĂM & LẬP LỊCH',
      items: [
        { label: 'Sơ đồ',             href: `${base}/bracket`,           icon: GitFork },
        { label: 'Cấu hình bán kết',  href: `${base}/semifinals-config`, icon: Settings },
        { label: 'Lịch & trận',       href: `${base}/schedule`,          icon: CalendarDays },
      ],
    },
    {
      title: 'VẬN HÀNH',
      items: [
        { label: 'Vận hành LIVE', href: `${base}/live`, icon: Radio },
      ],
    },
  ]

  const { label: statusLabel, dot: dotClass } = STATUS_CONFIG[tournament.status]

  return (
    <aside className="w-[204px] flex-shrink-0 flex flex-col h-screen bg-zinc-900 border-r border-zinc-800 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-[13px] flex-shrink-0">
          FB
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight">FB Tournament</p>
          <p className="text-[10px] text-zinc-500 leading-tight">Quản lý giải cầu lông</p>
        </div>
      </div>

      {/* Tournament selector */}
      <div className="px-2 py-2 border-b border-zinc-800 flex-shrink-0">
        <button className="w-full flex items-center justify-between gap-1 px-2 py-2 rounded-md hover:bg-zinc-800 transition-colors text-left group">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate leading-snug">
              {tournament.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClass)} />
              <span className="text-[11px] text-zinc-400">{statusLabel}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1.5" style={{ scrollbarWidth: 'none' }}>
        {sections.map((section) => (
          <div key={section.title} className="mb-0.5">
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-[7px] mx-1.5 rounded-md text-[13px] transition-colors',
                    isActive
                      ? [
                          'bg-zinc-800 text-white font-medium',
                          'before:absolute before:left-0 before:inset-y-1.5 before:w-0.5',
                          'before:bg-white before:rounded-full',
                        ]
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] tabular-nums bg-zinc-700/80 text-zinc-300 rounded px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
