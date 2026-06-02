'use client'

import { cn } from '@/lib/utils'

export const authInputCls = cn(
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2.5',
  'text-sm text-white placeholder:text-zinc-600',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
)

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="lg:hidden flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-[13px]">
          FB
        </div>
        <span className="text-[14px] font-semibold">FB Tournament</span>
      </div>
      <h1 className="text-[22px] font-bold text-white">{title}</h1>
      <p className="text-[13px] text-zinc-400 mt-1">{subtitle}</p>
    </div>
  )
}

export function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null
  return <p className="text-[12px] text-red-400 mt-1">{message}</p>
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        'w-full py-2.5 rounded-md text-sm font-medium transition-colors',
        disabled ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-white',
      )}
    >
      {children}
    </button>
  )
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-md border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
        <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75z" />
      </svg>
      Tiếp tục với Google
    </button>
  )
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <span className="flex-1 h-px bg-zinc-800" />
      <span className="text-[11px] text-zinc-600 uppercase tracking-wider">hoặc</span>
      <span className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}
