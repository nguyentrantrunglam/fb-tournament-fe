'use client'

import { Loader2 } from 'lucide-react'
import { RegistrationsClient } from './_components/RegistrationsClient'
import { useTournament } from '../_components/tournament-context'
import { useRegistrations } from '@/lib/registrations/queries'
import { fetchCategoryFilterOptions } from '@/lib/tournaments/api'
import { useQuery } from '@tanstack/react-query'

export default function RegistrationsPage() {
  const tournament = useTournament()

  const { data: regData, isLoading: regLoading } = useRegistrations(tournament.id)

  const { data: cats = [], isLoading: catsLoading } = useQuery({
    queryKey: ['category-filter-options', tournament.id],
    queryFn: () => fetchCategoryFilterOptions(tournament.id),
  })

  if (regLoading || catsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải đăng ký…
      </div>
    )
  }

  const rows = regData?.registrations ?? []
  const totalCount = regData?.totalCount ?? rows.length

  return (
    <RegistrationsClient
      tournamentId={tournament.id}
      categories={cats}
      registrations={rows}
      totalCount={totalCount}
    />
  )
}
