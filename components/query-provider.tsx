'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'

// Mở rộng kiểu meta cho tất cả useMutation trong dự án.
// - meta.success: string hoặc hàm nhận (data, variables) → string
// - meta.successDesc: mô tả phụ hiện dưới title toast
// Nếu không set meta.success → không hiện success toast.
// onError luôn tự hiện toast — không cần thêm thủ công trong từng mutation.
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      success?: string | ((data: unknown, variables: unknown) => string)
      successDesc?: string
    }
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess(data, variables, _ctx, mutation) {
            const s = mutation.meta?.success
            if (!s) return
            const msg = typeof s === 'function' ? s(data, variables) : s
            toast.success(msg, { description: mutation.meta?.successDesc })
          },
          onError(error) {
            toast.error(
              error instanceof Error ? error.message : 'Có lỗi xảy ra, thử lại.',
            )
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
