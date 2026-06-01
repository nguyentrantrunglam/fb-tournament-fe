import { cn } from '@/lib/utils'

/**
 * Layout chuẩn cho các trang trong tournament organizer.
 *
 * Scroll behavior:
 *   - PageHeader (tầng 1) scroll lên bình thường
 *   - Khi header biến khỏi viewport → panel preview sticky tại top-0
 *   - mainContent tiếp tục scroll cùng page
 *
 * Dùng khi:
 *   - Màn hình có panel preview cần sticky (preview public, summary, help) → 40%
 *   - Không có preview → layout 1 cột đơn giản
 */

// ─── PageHeader ──────────────────────────────────────────────────────────────

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-8 pt-7 pb-5 gap-4', className)}>
      <div>
        <h1 className="text-[22px] font-bold text-white">{title}</h1>
        {description && (
          <p className="text-[13px] text-zinc-400 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}

// ─── PageBody ─────────────────────────────────────────────────────────────────

type PageBodyProps = {
  /** Nội dung chính (tabs + form, table, v.v.) */
  children: React.ReactNode
  /** Panel preview sticky — bên trái hoặc phải nội dung chính */
  preview?: React.ReactNode
  /** Vị trí preview. Mặc định: 'right' */
  previewSide?: 'left' | 'right'
  /** Bề rộng preview tính bằng %. Mặc định: 40 (chuẩn cho mọi màn có preview) */
  previewWidthPct?: number
}

/**
 * Layout chuẩn 2 cột cho mọi màn có preview: nội dung chính (flex-1) + panel preview
 * sticky chiếm `previewWidthPct`% (mặc định 40%). Panel chỉ lo positioning + width;
 * chrome (border/padding nội dung) do component preview tự quyết.
 * Không truyền `preview` → render 1 cột full-width.
 */
export function PageBody({
  children,
  preview,
  previewSide = 'right',
  previewWidthPct = 40,
}: PageBodyProps) {
  if (!preview) {
    return <div>{children}</div>
  }

  const panel = (
    <div
      className={cn(
        'sticky top-0 self-start flex-shrink-0 p-6 border-zinc-800',
        previewSide === 'left' ? 'border-r' : 'border-l',
      )}
      style={{ width: `${previewWidthPct}%` }}
    >
      {preview}
    </div>
  )

  return (
    <div className="flex items-start">
      {previewSide === 'left' && panel}
      <div className="flex-1 min-w-0">{children}</div>
      {previewSide === 'right' && panel}
    </div>
  )
}
