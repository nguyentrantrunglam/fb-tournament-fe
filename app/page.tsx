'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, LayoutDashboard, Trophy, LogOut } from 'lucide-react'
import { useCurrentUser } from '@/lib/auth/auth-provider'
import { RequireAuth } from '@/lib/auth/require-auth'
import { signOut } from '@/lib/auth/client'
import { ROLE_LABEL, canManageTournaments } from '@/lib/auth/roles'

function NavCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-orange-400" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <p className="text-[12px] text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  )
}

function Home() {
  const { user, globalRole, setUser } = useCurrentUser()
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    setUser(null) // clear context so guarded screens no longer see a (now dead) session
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[13px] text-zinc-400">Xin chào,</p>
            <p className="text-[18px] font-bold">{user?.displayName || user?.email}</p>
            <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {globalRole ? ROLE_LABEL[globalRole] : '…'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>

        <div className="space-y-3">
          {globalRole === 'admin' && (
            <NavCard href="/admin" icon={Shield} title="Quản trị hệ thống" desc="Quản lý người dùng, cấp quyền" />
          )}
          {canManageTournaments(globalRole) ? (
            <NavCard
              href="/tournaments"
              icon={LayoutDashboard}
              title="Khu vực Ban tổ chức"
              desc="Giải của tôi · tạo & quản lý giải"
            />
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-zinc-400">Khu vực Ban tổ chức</p>
                <p className="text-[12px] text-zinc-600 mt-0.5">Cần quyền Tổ chức — liên hệ admin để được cấp.</p>
              </div>
            </div>
          )}
          <NavCard href="/" icon={Trophy} title="Giải của tôi" desc="Giải đang tham gia (VĐV) — sắp có" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <RequireAuth>
      <Home />
    </RequireAuth>
  )
}
