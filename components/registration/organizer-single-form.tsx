'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { organizerSingleSchema, type OrganizerSingleInput } from '@/lib/validators/registration'
import { useCreateOrganizerRegistration } from '@/lib/registrations/queries'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { PartnerPicker } from './partner-picker'
import type { CategoryWithStats } from '@/lib/types/category'
import type { SearchUsersResult } from '@/lib/registrations/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const selectCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'cursor-pointer transition-colors',
)

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  tournamentId: string
  categories: CategoryWithStats[]
  onCreated?: () => void
}

export function OrganizerSingleForm({
  open,
  onOpenChange,
  tournamentId,
  categories,
  onCreated,
}: Props) {
  const [err, setErr] = useState<string | null>(null)
  const [primary, setPrimary] = useState<SearchUsersResult | null>(null)
  const [partner, setPartner] = useState<SearchUsersResult | null>(null)

  const mutation = useCreateOrganizerRegistration(tournamentId)

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerSingleInput>({
    resolver: zodResolver(organizerSingleSchema),
    defaultValues: { categoryId: '', primaryUserId: '', partnerUserId: undefined },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null
  const isDoubles = selectedCategory?.playerCount === 2

  // Reset partner when category changes (playerCount might differ)
  useEffect(() => {
    setPartner(null)
  }, [selectedCategoryId])

  function handleClose() {
    onOpenChange(false)
    reset()
    setPrimary(null)
    setPartner(null)
    setErr(null)
  }

  async function onSubmit(data: OrganizerSingleInput) {
    setErr(null)
    if (!primary) { setErr('Chọn VĐV chính'); return }
    if (isDoubles && !partner) { setErr('Chọn partner cho nội dung đôi'); return }
    try {
      await mutation.mutateAsync({
        categoryId: data.categoryId,
        primaryUserId: primary.id,
        ...(partner ? { partnerUserId: partner.id } : {}),
      })
      onCreated?.()
      handleClose()
    } catch (e) {
      setErr(authErrorMessage(e))
    }
  }

  const openCats = categories.filter((c) => c.registrationStatus === 'open')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Đăng ký hộ (1 đội)</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-[12px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Category selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-zinc-300 font-medium">
              Hạng mục <span className="text-red-400 ml-0.5">*</span>
            </label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <select {...field} className={selectCls}>
                  <option value="">— Chọn hạng mục —</option>
                  {openCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.categoryId && (
              <p className="text-[12px] text-red-400">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Primary athlete search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-zinc-300 font-medium">
              VĐV chính <span className="text-red-400 ml-0.5">*</span>
            </label>
            <PartnerPicker
              tournamentId={tournamentId}
              primaryGender={null}
              genderRequirement={selectedCategory?.genderRequirement ?? 'unrestricted'}
              value={primary}
              onChange={(u) => { setPrimary(u); setPartner(null) }}
              excludeIds={[]}
            />
          </div>

          {/* Partner search — only for doubles */}
          {isDoubles && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-zinc-300 font-medium">
                Partner <span className="text-red-400 ml-0.5">*</span>
              </label>
              <PartnerPicker
                tournamentId={tournamentId}
                primaryGender={primary?.gender ?? null}
                genderRequirement={selectedCategory!.genderRequirement}
                value={partner}
                onChange={setPartner}
                excludeIds={primary ? [primary.id] : []}
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
              {isSubmitting || mutation.isPending ? 'Đang lưu…' : 'Đăng ký hộ'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
