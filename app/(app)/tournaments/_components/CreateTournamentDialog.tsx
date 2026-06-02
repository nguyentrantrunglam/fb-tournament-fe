'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createTournamentSchema, type CreateTournamentFormData } from '@/lib/validators/create-tournament'
import { createTournament } from '@/lib/tournaments/api'
import { authErrorMessage } from '@/lib/auth/auth-error'

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

export function CreateTournamentDialog({ open, onOpenChange, onCreated }: Props) {
  const [err, setErr] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTournamentFormData>({
    resolver: zodResolver(createTournamentSchema) as Resolver<CreateTournamentFormData>,
    defaultValues: { name: '', startDate: '', endDate: '', location: '' },
  })

  async function onSubmit(data: CreateTournamentFormData) {
    setErr(null)
    try {
      const { id } = await createTournament(data)
      reset()
      onCreated(id)
    } catch (e) {
      setErr(authErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Tạo giải mới</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-[12px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{err}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Tên giải</label>
            <input {...register('name')} placeholder="VD: Giải Cầu Lông Mở Rộng 2026" className={inputCls} autoFocus />
            {errors.name && <p className="text-[12px] text-red-400 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Bắt đầu</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <input {...register('startDate')} type="date" className={cn(inputCls, 'pl-8')} />
              </div>
              {errors.startDate && <p className="text-[12px] text-red-400 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Kết thúc</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <input {...register('endDate')} type="date" className={cn(inputCls, 'pl-8')} />
              </div>
              {errors.endDate && <p className="text-[12px] text-red-400 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Địa điểm</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input {...register('location')} placeholder="Nhà thi đấu…" className={cn(inputCls, 'pl-8')} />
            </div>
            {errors.location && <p className="text-[12px] text-red-400 mt-1">{errors.location.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isSubmitting ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-white',
              )}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo giải'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
