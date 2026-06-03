'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addCourtSchema, type AddCourtInput } from '@/lib/validators/court'

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestedName: string
  onAdd: (name: string) => Promise<void>
}

export function AddCourtDialog({ open, onOpenChange, suggestedName, onAdd }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddCourtInput>({
    resolver: zodResolver(addCourtSchema) as Resolver<AddCourtInput>,
    defaultValues: { name: suggestedName },
  })

  useEffect(() => {
    if (open) reset({ name: suggestedName })
  }, [open, suggestedName, reset])

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  async function onSubmit(data: AddCourtInput) {
    try {
      await onAdd(data.name.trim())
      handleClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo sân, thử lại.'
      setError('name', { message: msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Thêm sân</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-zinc-400 -mt-1">
          Tạo sân thi đấu cho giải. Gán trọng tài cố định sau khi tạo.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">
              Tên sân <span className="text-red-400">*</span>
            </label>
            <input {...register('name')} placeholder="Sân 4" className={inputCls} autoFocus />
            {errors.name && (
              <p className="text-[12px] text-red-400 mt-1">{errors.name.message}</p>
            )}
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
              {isSubmitting ? 'Đang tạo...' : 'Thêm sân'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
