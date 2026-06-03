'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loginSchema, type LoginFormData } from '@/lib/validators/login'
import { signInEmail, landingForUser } from '@/lib/auth/client'
import { useCurrentUser } from '@/lib/auth/auth-provider'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { authInputCls, AuthHeader, FieldError, SubmitButton } from '../_components/auth-ui'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useCurrentUser()
  const [showPw, setShowPw] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as Resolver<LoginFormData>,
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormData) {
    setAuthError(null)
    try {
      const user = await signInEmail(data.email, data.password)
      setUser(user) // populate context immediately so guarded screens see the session
      router.push(landingForUser(user))
    } catch (e) {
      setAuthError(authErrorMessage(e))
    }
  }

  return (
    <>
      <AuthHeader title="Đăng nhập" subtitle="Chào mừng trở lại với FB Tournament." />

      {authError && (
        <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-[13px] text-zinc-300 font-medium block mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="ban@example.com" className={authInputCls} autoFocus />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] text-zinc-300 font-medium">Mật khẩu</label>
            <Link href="/forgot-password" className="text-[12px] text-orange-400 hover:text-orange-300 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
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

        <SubmitButton disabled={isSubmitting}>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</SubmitButton>
      </form>

      <p className="text-center text-[13px] text-zinc-400 mt-6">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
          Đăng ký
        </Link>
      </p>
    </>
  )
}
