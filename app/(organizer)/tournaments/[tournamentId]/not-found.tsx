'use client'

import { useParams } from 'next/navigation'
import { NotFoundView } from '@/components/not-found-view'

// Render trong chrome của tournament layout (sidebar + header).
// Kích hoạt bởi catch-all [...unmatched] khi route con chưa tồn tại.
export default function TournamentNotFound() {
  const params = useParams<{ tournamentId: string }>()
  const base = params?.tournamentId ? `/tournaments/${params.tournamentId}` : '/'

  return (
    <NotFoundView
      description="Màn hình này chưa được xây dựng trong hệ thống hoặc đường dẫn không đúng."
      backHref={base}
      backLabel="Về tổng quan giải"
    />
  )
}
