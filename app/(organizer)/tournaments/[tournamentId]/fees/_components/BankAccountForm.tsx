'use client'

import { ChevronDown } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { VN_BANKS, bankLabel } from '@/lib/data/vn-banks'
import { MEMO_VARIABLES } from '@/lib/types/payment'
import type { PaymentConfigFormData } from '@/lib/validators/payment-config'

const inputCls = cn(
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2',
  'text-sm text-white placeholder:text-zinc-600',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'transition-colors',
)

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | undefined
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-zinc-300 font-medium">{label}</label>
      {children}
      {error ? (
        <p className="text-[12px] text-red-400">{error}</p>
      ) : (
        hint && <p className="text-[12px] text-zinc-600">{hint}</p>
      )}
    </div>
  )
}

type Props = {
  register: UseFormRegister<PaymentConfigFormData>
  errors: FieldErrors<PaymentConfigFormData>
}

export function BankAccountForm({ register, errors }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
      <h2 className="text-[15px] font-semibold text-white">Thông tin tài khoản nhận</h2>

      <Field label="Tên chủ tài khoản" error={errors.accountHolder?.message}>
        <input {...register('accountHolder')} placeholder="NGUYEN VAN A" className={inputCls} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Số tài khoản" error={errors.accountNumber?.message}>
          <input {...register('accountNumber')} placeholder="0123 4567 8901" className={inputCls} />
        </Field>
        <Field label="Ngân hàng" error={errors.bankCode?.message}>
          <div className="relative">
            <select
              {...register('bankCode')}
              className={cn(inputCls, 'appearance-none pr-9 cursor-pointer')}
            >
              {VN_BANKS.map((b) => (
                <option key={b.code} value={b.code} className="bg-zinc-900">
                  {bankLabel(b)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </Field>
      </div>

      <Field
        label="Nội dung chuyển khoản gợi ý (template)"
        error={errors.transferMemoTemplate?.message}
        hint={<>Biến: {MEMO_VARIABLES.join(' ')}</>}
      >
        <input
          {...register('transferMemoTemplate')}
          placeholder="SAIGON26 {tên_VĐV} {mã_hạng_mục}"
          className={cn(inputCls, 'font-mono text-[13px]')}
        />
      </Field>
    </section>
  )
}
