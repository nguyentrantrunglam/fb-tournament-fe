'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { adminUpdateUser, type AdminUser } from '@/lib/auth/admin-api'
import { authErrorMessage } from '@/lib/auth/auth-error'

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
)

type Props = {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onSaved: (uid: string, displayName: string) => void
}

export function EditUserDialog({ user, onOpenChange, onSaved }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Reset khi đổi user (adjust-state-during-render)
  const [prevUid, setPrevUid] = useState<string | null>(null)
  if (user && user.uid !== prevUid) {
    setPrevUid(user.uid)
    setDisplayName(user.displayName)
    setPhone('')
    setErr(null)
  }

  if (!user) return null

  async function onSave() {
    if (!user) return
    setSaving(true)
    setErr(null)
    try {
      await adminUpdateUser(user.uid, { displayName: displayName.trim(), phone: phone || undefined })
      onSaved(user.uid, displayName.trim())
      onOpenChange(false)
    } catch (e) {
      setErr(authErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Sửa thông tin user</DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-zinc-500 -mt-1">{user.email}</p>

        {err && (
          <div className="text-[12px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
            {err}
          </div>
        )}

        <div className="space-y-3 mt-1">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Họ tên</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">
              SĐT <span className="text-zinc-600">(để trống = giữ nguyên / xoá)</span>
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" className={inputCls} />
          </div>
          <p className="text-[11px] text-zinc-600">CCCD / giới tính / ngày sinh bị khoá (PII).</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onSave}
            disabled={saving || displayName.trim().length < 2}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              saving || displayName.trim().length < 2
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-white',
            )}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
