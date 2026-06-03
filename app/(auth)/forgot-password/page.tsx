'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sendResetEmail } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { authInputCls, AuthHeader, FieldError, SubmitButton } from '../_components/auth-ui'

const forgotSchema = z.object({
  email: z.string().min(1, 'Nhập email').email('Email không hợp lệ'),
})
type ForgotFormData = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema) as Resolver<ForgotFormData>,
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgotFormData) {
    setAuthError(null)
    try {
      await sendResetEmail(data.email)
      setSent(true)
    } catch (e) {
      setAuthError(authErrorMessage(e))
    }
  }

  return (
    <>
      <AuthHeader
        title="Quên mật khẩu"
        subtitle="Nhập email — chúng tôi sẽ gửi link đặt lại mật khẩu."
      />

      {sent ? (
        <div className="rounded-md bg-emerald-950/50 border border-emerald-900/60 px-4 py-3 text-[13px] text-emerald-300">
          Đã gửi link đặt lại mật khẩu (nếu email tồn tại trong hệ thống). Kiểm tra hòm thư.
        </div>
      ) : (
        <>
          {authError && (
            <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="ban@example.com"
                className={authInputCls}
                autoFocus
              />
              <FieldError message={errors.email?.message} />
            </div>

            <SubmitButton disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </SubmitButton>
          </form>
        </>
      )}

      <p className="text-center text-[13px] text-zinc-400 mt-6">
        <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Quay lại đăng nhập
        </Link>
      </p>
    </>
  )
}
