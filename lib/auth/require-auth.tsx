'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useCurrentUser } from './auth-provider'
import type { GlobalRole } from './roles'

function FullScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center gap-2 bg-zinc-950 text-zinc-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  )
}

function Forbidden() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950 text-white px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-amber-400" />
      </div>
      <div>
        <h1 className="text-[18px] font-bold">Chưa có quyền quản lý giải đấu</h1>
        <p className="text-[13px] text-zinc-400 mt-1 max-w-sm">
          Tài khoản của bạn chưa được cấp quyền Tổ chức. Liên hệ admin để được cấp quyền.
        </p>
      </div>
      <Link href="/" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors">
        Về trang chủ
      </Link>
    </div>
  )
}

// Guard client: chưa đăng nhập → /login; sai quyền → màn 403.
// roles rỗng = chỉ cần đăng nhập (bất kỳ globalRole).
export function RequireAuth({
  roles,
  children,
}: {
  roles?: GlobalRole[]
  children: React.ReactNode
}) {
  const { user, globalRole, loading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading) return <FullScreen label="Đang tải…" />
  if (!user) return <FullScreen label="Đang chuyển hướng…" />
  if (roles && (!globalRole || !roles.includes(globalRole))) return <Forbidden />
  return <>{children}</>
}
