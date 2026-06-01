'use client'

import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paymentConfigSchema, type PaymentConfigFormData } from '@/lib/validators/payment-config'
import type { PaymentConfig } from '@/lib/types/payment'
import type { CategoryFeeItem, CategoryRegistrationStatus } from '@/lib/types/category'
import { PageHeader, PageBody } from '../../_components/PageLayout'
import { BankAccountForm } from './BankAccountForm'
import { CategoryFeeList } from './CategoryFeeList'
import { QrUploader } from './QrUploader'
import { PublicPaymentPreview } from './PublicPaymentPreview'

type Props = {
  tournamentId: string
  initial: PaymentConfig
  initialCategories: CategoryFeeItem[]
  isPublic?: boolean
}

export function FeesQrClient({
  tournamentId,
  initial,
  initialCategories,
  isPublic = true,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CategoryFeeItem[]>(initialCategories)

  // Dirty khi có nội dung đổi lệ phí so với ban đầu
  const feesDirty = useMemo(
    () => categories.some((c) => c.fee !== initialCategories.find((i) => i.id === c.id)?.fee),
    [categories, initialCategories],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PaymentConfigFormData>({
    resolver: zodResolver(paymentConfigSchema) as Resolver<PaymentConfigFormData>,
    defaultValues: {
      accountHolder: initial.accountHolder,
      accountNumber: initial.accountNumber,
      bankCode: initial.bankCode,
      transferMemoTemplate: initial.transferMemoTemplate,
      qrUrl: initial.qrUrl,
    },
  })

  const formData = watch()
  const qrUrl = watch('qrUrl')

  function handleFeeChange(id: string, fee: number) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, fee } : c)))
  }

  // Mở/đóng cổng đăng ký — action tức thì, không gộp vào "Lưu thay đổi"
  function handleToggleRegistration(id: string, next: CategoryRegistrationStatus) {
    // TODO: gọi CF openRegistration/closeRegistration(categoryId) + audit log
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, registrationStatus: next } : c)))
  }

  async function onSubmit() {
    setSaving(true)
    // TODO: gọi CF setPaymentConfig(tournamentId, formData) + setCategoryFees(changed) + audit log
    void tournamentId
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    // TODO: toast success
  }

  const dirty = isDirty || feesDirty

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
            qrUrl={qrUrl}
            isPublic={isPublic}
            onChange={(url) => setValue('qrUrl', url, { shouldDirty: true })}
          />
        </form>
      </PageBody>
    </>
  )
}
