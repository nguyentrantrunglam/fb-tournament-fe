'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { registerSchema, type RegisterFormData } from '@/lib/validators/signup'
import { signUp, landingForUser } from '@/lib/auth/client'
import { useCurrentUser } from '@/lib/auth/auth-provider'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { authInputCls, AuthHeader, FieldError, SubmitButton } from '../_components/auth-ui'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useCurrentUser()
  const [showPw, setShowPw] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterFormData>,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      nationalId: '',
      dob: '',
      phone: '',
    },
  })

  const genderValue = watch('gender')

  async function onSubmit(data: RegisterFormData) {
    setAuthError(null)
    try {
      const user = await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        nationalId: data.nationalId,
        gender: data.gender,
        dob: data.dob,
        ...(data.phone ? { phone: data.phone } : {}),
      })
      setUser(user) // populate context immediately so guarded screens see the session
      router.push(landingForUser(user))
    } catch (e) {
      const msg = authErrorMessage(e)
      setAuthError(msg)
    }
  }

  return (
    <>
      <AuthHeader title="Tạo tài khoản" subtitle="Điền đầy đủ thông tin để đăng ký." />

      {authError && (
        <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="ban@example.com" className={authInputCls} autoFocus />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Password */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Mật khẩu</label>
          <div className="relative">
            <input
              {...register('password')}
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
          <FieldError message={errors.password?.message} />
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Nhập lại mật khẩu</label>
          <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={authInputCls} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {/* Full name */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Họ và tên</label>
          <input {...register('displayName')} placeholder="Nguyễn Văn A" className={authInputCls} />
          <FieldError message={errors.displayName?.message} />
        </div>

        {/* CCCD (stored as nationalId) */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">CCCD (12 số)</label>
          <input {...register('nationalId')} inputMode="numeric" placeholder="0123 4567 8901" className={authInputCls} />
          <FieldError message={errors.nationalId?.message} />
        </div>

        {/* Gender + DOB */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Giới tính</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue('gender', g, { shouldValidate: true })}
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
            <FieldError message={errors.gender?.message} />
          </div>
          <div>
            <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Ngày sinh</label>
            <input {...register('dob')} type="date" className={authInputCls} />
            <FieldError message={errors.dob?.message} />
          </div>
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">
            Số điện thoại <span className="text-zinc-600">(tuỳ chọn)</span>
          </label>
          <input {...register('phone')} inputMode="numeric" placeholder="0912345678" className={authInputCls} />
          <FieldError message={errors.phone?.message} />
        </div>

        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
        </SubmitButton>
      </form>

      <p className="text-center text-[13px] text-zinc-400 mt-6">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
