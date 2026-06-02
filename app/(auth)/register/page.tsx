'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountSchema, profileSchema, type AccountFormData, type ProfileFormData } from '@/lib/validators/signup'
import { signUpEmail, signInGoogle, completeProfile, landingForUser } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { authInputCls, AuthHeader, FieldError, SubmitButton, GoogleButton, OrDivider } from '../_components/auth-ui'

function StepDots({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: 'Tài khoản' },
    { n: 2, label: 'Hồ sơ' },
  ]
  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2">
          <span
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold',
              step > it.n ? 'bg-emerald-500/20 text-emerald-400' : step === it.n ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500',
            )}
          >
            {step > it.n ? <Check className="w-3 h-3" strokeWidth={3} /> : it.n}
          </span>
          <span className={cn('text-[12px]', step >= it.n ? 'text-zinc-200' : 'text-zinc-600')}>{it.label}</span>
          {i === 0 && <span className="w-6 h-px bg-zinc-800" />}
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [showPw, setShowPw] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const account = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema) as Resolver<AccountFormData>,
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })
  const profile = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormData>,
    defaultValues: { fullName: '', cccd: '', dob: '', phone: '' },
  })

  function onAccount() {
    setAuthError(null)
    setStep(2)
  }

  async function onProfile(data: ProfileFormData) {
    setAuthError(null)
    const acc = account.getValues()
    try {
      // B1: tạo Firebase Auth user
      await signUpEmail(acc.email, acc.password)
      // B2: CF transaction validate CCCD unique + tạo users/{uid} + cccdIndex
      await completeProfile({
        fullName: data.fullName,
        cccd: data.cccd,
        gender: data.gender,
        dob: data.dob,
        ...(data.phone ? { phone: data.phone } : {}),
      })
      router.push('/')
    } catch (e) {
      setAuthError(authErrorMessage(e))
      if ((e as { code?: string })?.code === 'auth/email-already-in-use') setStep(1)
    }
  }

  async function handleGoogle() {
    setAuthError(null)
    try {
      const cred = await signInGoogle()
      router.push(await landingForUser(cred.user))
    } catch (e) {
      setAuthError(authErrorMessage(e))
    }
  }

  const genderValue = profile.watch('gender')

  return (
    <>
      <AuthHeader
        title="Tạo tài khoản"
        subtitle={step === 1 ? 'Bắt đầu với email và mật khẩu.' : 'Hoàn tất hồ sơ vận động viên.'}
      />
      <StepDots step={step} />

      {authError && (
        <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
          {authError}
        </div>
      )}

      {step === 1 ? (
        <>
          <form onSubmit={account.handleSubmit(onAccount)} className="space-y-4">
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Email</label>
              <input {...account.register('email')} type="email" placeholder="ban@example.com" className={authInputCls} autoFocus />
              <FieldError message={account.formState.errors.email?.message} />
            </div>
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  {...account.register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  className={cn(authInputCls, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={account.formState.errors.password?.message} />
            </div>
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Nhập lại mật khẩu</label>
              <input {...account.register('confirmPassword')} type="password" placeholder="••••••••" className={authInputCls} />
              <FieldError message={account.formState.errors.confirmPassword?.message} />
            </div>
            <SubmitButton>Tiếp tục</SubmitButton>
          </form>

          <OrDivider />
          <GoogleButton onClick={handleGoogle} />
        </>
      ) : (
        <form onSubmit={profile.handleSubmit(onProfile)} className="space-y-4">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Họ và tên</label>
            <input {...profile.register('fullName')} placeholder="Nguyễn Văn A" className={authInputCls} autoFocus />
            <FieldError message={profile.formState.errors.fullName?.message} />
          </div>
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">CCCD (12 số)</label>
            <input {...profile.register('cccd')} inputMode="numeric" placeholder="0123 4567 8901" className={authInputCls} />
            <FieldError message={profile.formState.errors.cccd?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Giới tính</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => profile.setValue('gender', g, { shouldValidate: true })}
                    className={cn(
                      'py-2.5 rounded-md text-[13px] border transition-colors',
                      genderValue === g
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
                    )}
                  >
                    {g === 'male' ? 'Nam' : 'Nữ'}
                  </button>
                ))}
              </div>
              <FieldError message={profile.formState.errors.gender?.message} />
            </div>
            <div>
              <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Ngày sinh</label>
              <input {...profile.register('dob')} type="date" className={authInputCls} />
              <FieldError message={profile.formState.errors.dob?.message} />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">
              Số điện thoại <span className="text-zinc-600">(tuỳ chọn)</span>
            </label>
            <input {...profile.register('phone')} inputMode="numeric" placeholder="0912345678" className={authInputCls} />
            <FieldError message={profile.formState.errors.phone?.message} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </button>
            <div className="flex-1">
              <SubmitButton disabled={profile.formState.isSubmitting}>
                {profile.formState.isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </SubmitButton>
            </div>
          </div>
        </form>
      )}

      <p className="text-center text-[13px] text-zinc-400 mt-6">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
