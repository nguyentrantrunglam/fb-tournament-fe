'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Schema ───────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Nhập email hoặc số điện thoại')
    .max(100, 'Quá dài'),
})

type InviteInput = z.infer<typeof inviteSchema>

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

// ─── InviteRefereeDialog ──────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function InviteRefereeDialog({ open, onOpenChange }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema) as Resolver<InviteInput>,
    defaultValues: { emailOrPhone: '' },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  async function onSubmit(data: InviteInput) {
    // TODO: gọi CF grant-tournament-role(tournamentId, data.emailOrPhone, 'referee')
    // CF sẽ lookup user theo email/phone, trả về lỗi nếu không tìm thấy
    console.log('invite referee', data)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Mời trọng tài</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-zinc-400 -mt-1">
          Người dùng phải đã có tài khoản trong hệ thống. Sau khi mời, họ sẽ thấy giải này
          trong danh sách trọng tài của mình.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">
              Email hoặc số điện thoại <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                {...register('emailOrPhone')}
                placeholder="nguyen@example.com hoặc 0912345678"
                className={cn(inputCls, 'pl-8')}
                autoFocus
              />
            </div>
            {errors.emailOrPhone && (
              <p className="text-[12px] text-red-400 mt-1">{errors.emailOrPhone.message}</p>
            )}
          </div>

          {/* Info note */}
          <div className="bg-zinc-800/60 rounded-md px-3 py-2.5 text-[12px] text-zinc-500 leading-relaxed">
            Sau khi mời, tài khoản đó sẽ được cấp role{' '}
            <code className="text-zinc-300 bg-zinc-700 px-1 rounded text-[11px]">referee</code>{' '}
            cho giải này. Gán trọng tài vào sân tại màn hình{' '}
            <span className="text-zinc-300">Vận hành LIVE</span>.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isSubmitting
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-400 text-white',
              )}
            >
              {isSubmitting ? 'Đang gửi...' : 'Mời trọng tài'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
