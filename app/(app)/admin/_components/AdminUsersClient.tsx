'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, LogOut, Search, Pencil, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/lib/auth/auth-provider'
import { signOut } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { adminListUsers, adminSetGlobalRole, adminDeleteUser, type AdminUser } from '@/lib/auth/admin-api'
import { EditUserDialog } from './EditUserDialog'

const AVATAR = ['bg-amber-700 text-amber-100', 'bg-teal-700 text-teal-100', 'bg-blue-800 text-blue-100', 'bg-violet-800 text-violet-100', 'bg-rose-800 text-rose-100']
function initials(name: string, email: string | null) {
  const src = name || email || '?'
  const p = src.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? (p[p.length - 1]?.[0] ?? '') : '')).toUpperCase()
}
function avatarColor(seed: string) {
  return AVATAR[seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]!
}

export function AdminUsersClient() {
  const { user: me } = useCurrentUser()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  useEffect(() => {
    adminListUsers()
      .then(setUsers)
      .catch((e) => setError(authErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.displayName.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
  }, [users, search])

  async function changeRole(u: AdminUser, role: AdminUser['globalRole']) {
    if (role === u.globalRole) return
    setBusyUid(u.uid)
    try {
      await adminSetGlobalRole(u.uid, role)
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, globalRole: role } : x)))
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusyUid(null)
    }
  }

  async function doDelete(uid: string) {
    setBusyUid(uid)
    setConfirmDelete(null)
    try {
      await adminDeleteUser(uid)
      setUsers((prev) => prev.filter((x) => x.uid !== uid))
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold">Quản lý người dùng</h1>
              <p className="text-[12px] text-zinc-500">{users.length} người dùng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <button
              onClick={async () => { await signOut(); router.replace('/login') }}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên / email…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        </div>

        {error && (
          <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  {['Người dùng', 'Quyền', 'Giới tính', ''].map((h, i) => (
                    <th key={i} className={cn('py-2.5 px-4 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider', i === 3 && 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const isMe = u.uid === me?.uid
                  const busy = busyUid === u.uid
                  return (
                    <tr key={u.uid} className="border-b border-zinc-800/70 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={cn('w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0', avatarColor(u.uid))}>
                            {initials(u.displayName, u.email)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{u.displayName || '(chưa đặt tên)'} {isMe && <span className="text-[10px] text-orange-400">· bạn</span>}</p>
                            <p className="text-[12px] text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={u.globalRole}
                            disabled={isMe || busy}
                            onChange={(e) => changeRole(u, e.target.value as AdminUser['globalRole'])}
                            className={cn(
                              'appearance-none rounded-full pl-2.5 pr-7 py-1 text-[12px] font-medium border cursor-pointer disabled:cursor-not-allowed',
                              u.globalRole === 'admin'
                                ? 'text-orange-300 bg-orange-950 border-orange-900/60'
                                : u.globalRole === 'organizer'
                                ? 'text-blue-300 bg-blue-950 border-blue-900/60'
                                : 'text-zinc-300 bg-zinc-800 border-zinc-700',
                            )}
                          >
                            <option value="user">Người dùng</option>
                            <option value="organizer">Tổ chức</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[13px] text-zinc-400">
                        {u.gender === 'male' ? 'Nam' : u.gender === 'female' ? 'Nữ' : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-500 inline" />
                        ) : confirmDelete === u.uid ? (
                          <span className="inline-flex items-center gap-2 text-[12px]">
                            <span className="text-zinc-400">Xoá?</span>
                            <button onClick={() => doDelete(u.uid)} className="text-red-400 hover:text-red-300 font-medium">Có</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-zinc-500 hover:text-zinc-300">Không</button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <button onClick={() => setEditing(u)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="Sửa">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u.uid)}
                              disabled={isMe}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:text-zinc-500"
                              title={isMe ? 'Không thể xoá chính mình' : 'Xoá'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-[13px] text-zinc-600">Không có người dùng.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditUserDialog
        user={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={(uid, displayName) => setUsers((prev) => prev.map((x) => (x.uid === uid ? { ...x, displayName } : x)))}
      />
    </div>
  )
}
