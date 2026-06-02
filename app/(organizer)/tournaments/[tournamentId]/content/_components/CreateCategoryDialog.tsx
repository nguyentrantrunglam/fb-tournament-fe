'use client'

import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validators/category'
import type { CategoryWithStats } from '@/lib/types/category'
import { createCategory, updateCategory } from '@/lib/tournaments/api'
import { authErrorMessage } from '@/lib/auth/auth-error'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-zinc-300 font-medium">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  )
}

const inputCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

const selectCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'cursor-pointer transition-colors',
)

// ─── Gender options ────────────────────────────────────────────────────────────

type GenderOpt = { value: CreateCategoryInput['genderRequirement']; label: string; minPC?: number }

const GENDER_OPTS: GenderOpt[] = [
  { value: 'men_only',     label: 'Nam only' },
  { value: 'women_only',   label: 'Nữ only' },
  { value: 'mixed_pair',   label: 'Nam-nữ (đôi)', minPC: 2 },
  { value: 'unrestricted', label: 'Không giới hạn' },
]

// ─── CreateCategoryDialog ──────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  onCreated?: (() => void) | undefined
  /** Truyền hạng mục để sửa; null/undefined = tạo mới */
  editing?: CategoryWithStats | null
}

const EMPTY: CreateCategoryInput = {
  code: '',
  name: '',
  playerCount: 1,
  genderRequirement: 'men_only',
  bestOf: 3,
  fee: 0,
  maxTeams: 16,
  registrationDeadline: '',
}

export function CreateCategoryDialog({ open, onOpenChange, tournamentId, onCreated, editing }: Props) {
  const [err, setErr] = useState<string | null>(null)
  const isEdit = !!editing
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema) as Resolver<CreateCategoryInput>,
    defaultValues: EMPTY,
  })

  // Prefill khi mở dialog ở chế độ sửa
  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        code: editing.code,
        name: editing.name,
        playerCount: editing.playerCount,
        genderRequirement: editing.genderRequirement,
        bestOf: editing.bestOf,
        fee: editing.fee,
        maxTeams: editing.maxTeams,
        registrationDeadline: (editing.registrationDeadline ?? '').slice(0, 16),
      })
    } else {
      reset(EMPTY)
    }
  }, [open, editing, reset])

  const playerCount      = watch('playerCount')
  const genderRequirement = watch('genderRequirement')

  // Reset mixed_pair khi chuyển sang đơn — mixed_pair + playerCount=1 là invalid
  useEffect(() => {
    if (playerCount === 1 && genderRequirement === 'mixed_pair') {
      setValue('genderRequirement', 'men_only')
    }
  }, [playerCount, genderRequirement, setValue])

  const availableGenders = GENDER_OPTS.filter((g) => !g.minPC || g.minPC <= playerCount)

  function handleClose() {
    onOpenChange(false)
    reset(EMPTY)
  }

  async function onSubmit(data: CreateCategoryInput) {
    setErr(null)
    try {
      if (editing) await updateCategory(tournamentId, editing.id, data)
      else await createCategory(tournamentId, data)
      onCreated?.()
      handleClose()
    } catch (e) {
      setErr(authErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-white text-base">{isEdit ? 'Sửa hạng mục' : 'Tạo hạng mục mới'}</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-[12px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{err}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Code + Name */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <Field label="Mã" required error={errors.code?.message}>
              <input
                {...register('code')}
                placeholder="VD: MS, WD19"
                className={inputCls}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.value = el.value.toUpperCase()
                }}
              />
            </Field>
            <Field label="Tên hạng mục" required error={errors.name?.message}>
              <input
                {...register('name')}
                placeholder="VD: Đơn nam U19"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Player count + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số người / đội" required>
              <select
                {...register('playerCount', { valueAsNumber: true })}
                className={selectCls}
              >
                <option value={1}>1 người (đơn)</option>
                <option value={2}>2 người (đôi)</option>
              </select>
            </Field>
            <Field label="Giới tính" required error={errors.genderRequirement?.message}>
              <select {...register('genderRequirement')} className={selectCls}>
                {availableGenders.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Best of + Fee */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Best of" required>
              <select
                {...register('bestOf', { valueAsNumber: true })}
                className={selectCls}
              >
                <option value={1}>Best of 1</option>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
              </select>
            </Field>
            <Field label="Lệ phí (₫)" error={errors.fee?.message}>
              <input
                {...register('fee', { valueAsNumber: true })}
                type="number"
                min={0}
                step={10000}
                placeholder="0 = miễn phí"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Max teams + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số đội tối đa" required error={errors.maxTeams?.message}>
              <input
                {...register('maxTeams', { valueAsNumber: true })}
                type="number"
                min={2}
                max={256}
                className={inputCls}
              />
            </Field>
            <Field label="Hạn đăng ký" required error={errors.registrationDeadline?.message}>
              <input
                {...register('registrationDeadline')}
                type="datetime-local"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-2">
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
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo hạng mục'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
