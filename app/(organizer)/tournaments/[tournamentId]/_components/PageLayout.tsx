import { cn } from '@/lib/utils'

/**
 * Layout chuẩn cho các trang trong tournament organizer.
 *
 * Scroll behavior:
 *   - PageHeader (tầng 1) scroll lên bình thường
 *   - Khi header biến khỏi viewport → sidePanel sticky tại top-0
 *   - mainContent tiếp tục scroll cùng page
 *
 * Dùng khi:
 *   - Màn hình có một panel phụ bên phải cần sticky (preview, summary, help)
 *   - Dùng không có sidePanel → layout 1 cột đơn giản
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
  /** Panel phụ sticky — xuất hiện bên trái hoặc phải nội dung chính */
  sidePanel?: React.ReactNode
  /** Vị trí side panel. Mặc định: 'right' */
  sidePanelSide?: 'left' | 'right'
  /** Width của side panel tính bằng px. Mặc định: 280 */
  sidePanelWidth?: number
}

export function PageBody({
  children,
  sidePanel,
  sidePanelSide = 'right',
  sidePanelWidth = 280,
}: PageBodyProps) {
  if (!sidePanel) {
    return <div>{children}</div>
  }

  const panel = (
    <div
      className="sticky top-0 self-start flex-shrink-0"
      style={{ width: sidePanelWidth }}
    >
      {sidePanel}
    </div>
  )

  return (
    <div className="flex items-start">
      {sidePanelSide === 'left' && panel}
      <div className="flex-1 min-w-0">{children}</div>
      {sidePanelSide === 'right' && panel}
    </div>
  )
}
