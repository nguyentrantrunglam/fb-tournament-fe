'use client'

import { useEffect, useRef } from 'react'

// Trigger load-more khi sentinel cuộn vào viewport (IntersectionObserver).
// Gắn ref trả về vào 1 element ở cuối list.
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  onLoadMore,
  rootMargin = '240px',
}: {
  hasMore: boolean
  onLoadMore: () => void
  rootMargin?: string
}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore, rootMargin])

  return ref
}
