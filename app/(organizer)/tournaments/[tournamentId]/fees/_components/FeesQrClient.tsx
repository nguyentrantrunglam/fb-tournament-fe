'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paymentConfigSchema, type PaymentConfigFormData } from '@/lib/validators/payment-config'
import type { CategoryFeeItem, CategoryRegistrationStatus } from '@/lib/types/category'
import type { PaymentConfig } from '@/lib/types/payment'
import { PageHeader, PageBody } from '../../_components/PageLayout'
import { BankAccountForm } from './BankAccountForm'
import { CategoryFeeList } from './CategoryFeeList'
import { QrUploader } from './QrUploader'
import { PublicPaymentPreview } from './PublicPaymentPreview'
import { useTournament } from '../../_components/tournament-context'
import { useFeesData, useSaveFees, useToggleRegistration } from '@/lib/fees/queries'

const EMPTY_CONFIG: PaymentConfigFormData = {
  accountHolder: '',
  accountNumber: '',
  bankCode: '',
  transferMemoTemplate: '',
  qrUrl: null,
}

export function FeesQrClient({ tournamentId }: { tournamentId: string }) {
  const tournament = useTournament()
  const { data, isLoading } = useFeesData(tournamentId)
  const saveMutation = useSaveFees(tournamentId)
  const toggleMutation = useToggleRegistration(tournamentId)

  const [categories, setCategories] = useState<CategoryFeeItem[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentConfigFormData>({
    resolver: zodResolver(paymentConfigSchema) as Resolver<PaymentConfigFormData>,
    defaultValues: EMPTY_CONFIG,
  })

  // Reset form + categories khi data từ server về
  useEffect(() => {
    if (!data) return
    reset(
      data.paymentConfig
        ? {
            accountHolder: data.paymentConfig.accountHolder,
            accountNumber: data.paymentConfig.accountNumber,
            bankCode: data.paymentConfig.bankCode,
            transferMemoTemplate: data.paymentConfig.transferMemoTemplate,
            qrUrl: data.paymentConfig.qrUrl,
          }
        : EMPTY_CONFIG,
    )
    setCategories(data.categories)
  }, [data, reset])

  const originalFees = useMemo(
    () => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.fee])),
    [data],
  )
  const feesDirty = categories.some((c) => c.fee !== (originalFees[c.id] ?? c.fee))
  const dirty = isDirty || feesDirty

  function handleFeeChange(id: string, fee: number) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, fee } : c)))
  }

  function handleToggleRegistration(id: string, current: CategoryRegistrationStatus, next: 'open' | 'closed') {
    toggleMutation.mutate({ categoryId: id, currentStatus: current, nextStatus: next })
  }

  async function onSubmit(formData: PaymentConfigFormData) {
    const changedFees = categories
      .filter((c) => c.fee !== (originalFees[c.id] ?? c.fee))
      .map((c) => ({ id: c.id, fee: c.fee }))

    await saveMutation.mutateAsync({
      paymentConfig: formData as PaymentConfig,
      categoryFees: changedFees,
    })
  }

  const formData = watch()
  const qrUrl = watch('qrUrl')
  const saving = saveMutation.isPending

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  const actions = (
    <button
      type="button"
      onClick={handleSubmit(onSubmit)}
      disabled={saving || !dirty}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
        dirty && !saving
          ? 'bg-orange-500 hover:bg-orange-400 text-white'
          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
      )}
    >
      <Save className="w-4 h-4" />
      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
    </button>
  )

  return (
    <>
      <PageHeader
        title="Lệ phí & QR"
        description="Cấu hình thanh toán. Lệ phí thu ngoài app, BTC đánh dấu paid thủ công."
        actions={actions}
      />
      <PageBody preview={<PublicPaymentPreview data={formData} />}>
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
          <CategoryFeeList
            categories={categories}
            onFeeChange={handleFeeChange}
            onToggleRegistration={handleToggleRegistration}
          />
          <BankAccountForm register={register} errors={errors} />
          <QrUploader
            tournamentId={tournamentId}
            qrUrl={qrUrl}
            isPublic={tournament.isPublic}
            onChange={(url) => setValue('qrUrl', url, { shouldDirty: true })}
          />
        </form>
      </PageBody>
    </>
  )
}
