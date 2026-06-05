'use client'

import { User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CategoryFeeItem,
  GenderRequirement,
  CategoryRegistrationStatus,
} from '@/lib/types/category'

const AVATAR_STYLE: Record<GenderRequirement, string> = {
  men_only:     'bg-sky-900 text-sky-200',
  women_only:   'bg-rose-900 text-rose-200',
  mixed_pair:   'bg-violet-900 text-violet-200',
  unrestricted: 'bg-zinc-700 text-zinc-300',
}

const GENDER_LABEL: Record<GenderRequirement, string> = {
  men_only:     'nam only',
  women_only:   'nữ only',
  mixed_pair:   '1 nam + 1 nữ',
  unrestricted: 'không giới hạn',
}

// Nhãn trạng thái cạnh toggle. Off = chưa mở / đã đóng (đều không nhận ĐK).
const REG_LABEL: Record<CategoryRegistrationStatus, string> = {
  open:     'Đang nhận',
  not_open: 'Chưa mở',
  closed:   'Đã đóng',
}

// ─── Toggle cổng đăng ký ────────────────────────────────────────────────────
function RegistrationToggle({
  status,
  onToggle,
}: {
  status: CategoryRegistrationStatus
  onToggle: (current: CategoryRegistrationStatus, next: 'open' | 'closed') => void
}) {
  const isOpen = status === 'open'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOpen}
      aria-label="Cổng đăng ký"
      onClick={() => onToggle(status, isOpen ? 'closed' : 'open')}
      className="flex items-center gap-2 flex-shrink-0"
      title={isOpen ? 'Đóng cổng đăng ký' : 'Mở cổng đăng ký'}
    >
      <span className={cn('text-[11px] w-14 text-right', isOpen ? 'text-blue-300' : 'text-zinc-500')}>
        {REG_LABEL[status]}
      </span>
      <span
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
          isOpen ? 'bg-blue-500' : 'bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            isOpen && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

// ─── Một dòng nội dung ──────────────────────────────────────────────────────
function FeeRow({
  cat,
  onFeeChange,
  onToggleRegistration,
}: {
  cat: CategoryFeeItem
  onFeeChange: (id: string, fee: number) => void
  onToggleRegistration: (id: string, current: CategoryRegistrationStatus, next: 'open' | 'closed') => void
}) {
  const unit = cat.playerCount === 1 ? '/ VĐV' : '/ cặp'

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 last:border-b-0">
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[12px] flex-shrink-0 select-none',
          AVATAR_STYLE[cat.genderRequirement],
        )}
      >
        {cat.code.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-white truncate">{cat.name}</p>
        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
          {cat.playerCount === 1
            ? <User className="w-3 h-3 text-zinc-600" />
            : <Users className="w-3 h-3 text-zinc-600" />}
          {cat.playerCount} người · {GENDER_LABEL[cat.genderRequirement]}
        </p>
      </div>

      {/* Lệ phí */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <input
            type="number"
            min={0}
            step={1000}
            value={cat.fee}
            onChange={(e) => onFeeChange(cat.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className={cn(
              'w-32 bg-zinc-900 border border-zinc-700 rounded-md pl-3 pr-9 py-1.5 text-right',
              'text-[13px] text-white tabular-nums',
              'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500 pointer-events-none">
            ₫
          </span>
        </div>
        <span className="text-[11px] text-zinc-600 w-12">
          {cat.fee > 0 ? unit : <span className="text-emerald-500">miễn phí</span>}
        </span>
      </div>

      {/* Cổng đăng ký */}
      <div className="pl-3 ml-1 border-l border-zinc-800">
        <RegistrationToggle
          status={cat.registrationStatus}
          onToggle={(current, next) => onToggleRegistration(cat.id, current, next)}
        />
      </div>
    </div>
  )
}

type Props = {
  categories: CategoryFeeItem[]
  onFeeChange: (id: string, fee: number) => void
  onToggleRegistration: (id: string, current: CategoryRegistrationStatus, next: 'open' | 'closed') => void
}

export function CategoryFeeList({ categories, onFeeChange, onToggleRegistration }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-semibold text-white">Lệ phí &amp; cổng đăng ký theo nội dung</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">
          Đặt lệ phí (snapshot vào đăng ký lúc VĐV ĐK) và mở/đóng cổng đăng ký từng nội dung.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="px-5 pb-6 pt-2 text-center text-[13px] text-zinc-600">
          Chưa có nội dung nào — tạo ở mục <span className="text-zinc-400">Nội dung</span>.
        </div>
      ) : (
        <div>
          {categories.map((cat) => (
            <FeeRow
              key={cat.id}
              cat={cat}
              onFeeChange={onFeeChange}
              onToggleRegistration={onToggleRegistration}
            />
          ))}
        </div>
      )}
    </section>
  )
}
