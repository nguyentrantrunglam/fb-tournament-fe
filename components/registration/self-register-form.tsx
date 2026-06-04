'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { selfRegisterSchema, type SelfRegisterInput } from '@/lib/validators/registration'
import { useCreateSelfRegistration } from '@/lib/registrations/queries'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { PartnerPicker } from './partner-picker'
import type { CategoryWithStats } from '@/lib/types/category'
import type { ApiUser } from '@/lib/auth/auth-provider'
import type { SearchUsersResult } from '@/lib/registrations/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  tournamentId: string
  category: CategoryWithStats
  currentUser: ApiUser
  onRegistered?: () => void
}

export function SelfRegisterForm({
  open,
  onOpenChange,
  tournamentId,
  category,
  currentUser,
  onRegistered,
}: Props) {
  const [err, setErr] = useState<string | null>(null)
  const [partner, setPartner] = useState<SearchUsersResult | null>(null)

  const mutation = useCreateSelfRegistration(tournamentId)

  const { handleSubmit, reset, formState: { isSubmitting } } = useForm<SelfRegisterInput>({
    resolver: zodResolver(selfRegisterSchema),
  })

  const isDoubles = category.playerCount === 2

  function handleClose() {
    onOpenChange(false)
    reset()
    setPartner(null)
    setErr(null)
  }

  async function onSubmit() {
    setErr(null)
    if (isDoubles && !partner) {
      setErr('Chọn partner cho nội dung đôi')
      return
    }
    try {
      await mutation.mutateAsync({
        categoryId: category.id,
        ...(partner ? { partnerUserId: partner.id } : {}),
      })
      onRegistered?.()
      handleClose()
    } catch (e) {
      setErr(authErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">
            Đăng ký: {category.name}
          </DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-[12px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Primary athlete — read-only (current session user) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-zinc-300 font-medium">VĐV chính</label>
            <div className={cn(inputCls, 'opacity-60 cursor-not-allowed')}>
              {currentUser.displayName}
            </div>
          </div>

          {/* Partner picker for doubles categories */}
          {isDoubles && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-zinc-300 font-medium">
                Partner <span className="text-red-400 ml-0.5">*</span>
              </label>
              <PartnerPicker
                tournamentId={tournamentId}
                primaryGender={currentUser.gender}
                genderRequirement={category.genderRequirement}
                value={partner}
                onChange={setPartner}
                excludeIds={[currentUser.id]}
              />
            </div>
          )}

          <DialogFooter className="gap-2 bg-zinc-900 border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isSubmitting || mutation.isPending
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-400 text-white',
              )}
            >
              {isSubmitting || mutation.isPending ? 'Đang đăng ký…' : 'Đăng ký'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
