'use client'

import { Loader2 } from 'lucide-react'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

// Đặt ở cuối list. Khi cuộn tới → gọi onLoadMore. Ẩn khi hết dữ liệu.
export function InfiniteScrollSentinel({
  hasMore,
  onLoadMore,
  label = 'Đang tải thêm…',
}: {
  hasMore: boolean
  onLoadMore: () => void
  label?: string
}) {
  const ref = useInfiniteScroll({ hasMore, onLoadMore })

  if (!hasMore) return null

  return (
    <div ref={ref} className="flex items-center justify-center gap-2 py-5 text-[12px] text-zinc-500">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {label}
    </div>
  )
}
