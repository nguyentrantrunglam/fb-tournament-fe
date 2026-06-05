'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BracketClient } from './_components/BracketClient'
import { useTournament } from '../_components/tournament-context'
import { fetchCategories } from '@/lib/tournaments/api'
import type { CategoryWithStats } from '@/lib/types/category'

export default function BracketPage() {
  const tournament = useTournament()
  const [categories, setCategories] = useState<CategoryWithStats[] | null>(null)

  const load = useCallback(() => {
    fetchCategories(tournament.id)
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [tournament.id])

  useEffect(() => {
    load()
  }, [load])

  if (categories === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải hạng mục…
      </div>
    )
  }

  return <BracketClient categories={categories} />
}
