'use client'

import { useEffect, useState } from 'react'
import { TournamentInfoClient } from './_components/TournamentInfoClient'
import { useTournament } from '../_components/tournament-context'
import { fetchCategoryFilterOptions } from '@/lib/tournaments/api'

export default function TournamentInfoPage() {
  const tournament = useTournament()
  const [codes, setCodes] = useState<string[]>([])

  useEffect(() => {
    fetchCategoryFilterOptions(tournament.id)
      .then((cats) => setCodes(cats.map((c) => c.code)))
      .catch(() => setCodes([]))
  }, [tournament.id])

  return <TournamentInfoClient categories={codes} />
}
