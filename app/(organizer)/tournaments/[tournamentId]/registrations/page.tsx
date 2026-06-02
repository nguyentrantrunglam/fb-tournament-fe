'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { RegistrationsClient } from './_components/RegistrationsClient'
import { useTournament } from '../_components/tournament-context'
import { fetchRegistrations, fetchCategoryFilterOptions } from '@/lib/tournaments/api'
import type { RegistrationRow, CategoryFilterOption } from '@/lib/types/registration'

export default function RegistrationsPage() {
  const tournament = useTournament()
  const [data, setData] = useState<{ rows: RegistrationRow[]; cats: CategoryFilterOption[] } | null>(null)

  useEffect(() => {
    Promise.all([fetchRegistrations(tournament.id), fetchCategoryFilterOptions(tournament.id)])
      .then(([rows, cats]) => setData({ rows, cats }))
      .catch(() => setData({ rows: [], cats: [] }))
  }, [tournament.id])

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải đăng ký…
      </div>
    )
  }

  return (
    <RegistrationsClient
      tournamentId={tournament.id}
      categories={data.cats}
      registrations={data.rows}
      totalCount={data.rows.length}
    />
  )
}
