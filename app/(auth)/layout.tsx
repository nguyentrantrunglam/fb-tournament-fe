import { Trophy } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-zinc-950 text-white">
      {/* Brand panel — desktop */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 22px)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-sm">
            FB
          </div>
          <div>
            <p className="text-[14px] font-semibold leading-tight">FB Tournament</p>
            <p className="text-[11px] text-zinc-500 leading-tight">Quản lý giải cầu lông</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Trophy className="w-8 h-8 text-orange-500 mb-4" />
          <h2 className="text-[26px] font-bold leading-snug">
            Tổ chức giải cầu lông phong trào, gọn gàng từ A đến Z.
          </h2>
          <p className="text-[14px] text-zinc-400 mt-3 leading-relaxed">
            Đăng ký, bốc thăm, lập lịch, vận hành live và công bố kết quả — tất cả trong một nơi.
          </p>
        </div>

        <p className="relative text-[12px] text-zinc-600">© 2026 FB Tournament</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
