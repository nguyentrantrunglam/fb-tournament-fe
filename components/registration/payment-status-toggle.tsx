'use client'

import { cn } from '@/lib/utils'
import { useMarkPaid, useUnmarkPaid } from '@/lib/registrations/queries'
import type { RegistrationPaymentStatus } from '@/lib/types/registration'

type Props = {
  tournamentId: string
  registrationId: string
  paymentStatus: RegistrationPaymentStatus
  disabled?: boolean
}

export function PaymentStatusToggle({
  tournamentId,
  registrationId,
  paymentStatus,
  disabled,
}: Props) {
  const markPaid = useMarkPaid(tournamentId)
  const unmarkPaid = useUnmarkPaid(tournamentId)

  const isPending = markPaid.isPending || unmarkPaid.isPending
  const isPaid = paymentStatus === 'paid'

  function handleToggle() {
    if (isPending || disabled) return
    if (isPaid) {
      unmarkPaid.mutate(registrationId)
    } else {
      markPaid.mutate(registrationId)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending || disabled}
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors',
        isPending || disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        isPaid
          ? 'text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60'
          : 'text-amber-400 bg-amber-950/50 hover:bg-amber-900/50',
      )}
      title={isPaid ? 'Bấm để bỏ đánh dấu đã thu' : 'Bấm để đánh dấu đã thu'}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isPaid ? 'bg-emerald-400' : 'bg-amber-400',
        )}
      />
      {isPaid ? 'đã thu' : 'chờ thu'}
    </button>
  )
}
