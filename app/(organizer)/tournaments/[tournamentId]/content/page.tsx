'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CategoryList } from './_components/CategoryList'
import { useTournament } from '../_components/tournament-context'
import { fetchCategories } from '@/lib/tournaments/api'
import type { CategoryWithStats } from '@/lib/types/category'

export default function ContentPage() {
  const tournament = useTournament()
  const [categories, setCategories] = useState<CategoryWithStats[] | null>(null)

  const reload = useCallback(() => {
    fetchCategories(tournament.id)
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [tournament.id])

  useEffect(() => {
    reload()
  }, [reload])

  // Sau khi bốc thăm (running/completed) → không tạo hạng mục mới
  const canCreate = tournament.status === 'draft' || tournament.status === 'open'

  if (categories === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải hạng mục…
      </div>
    )
  }

  return (
    <CategoryList
      categories={categories}
      tournamentId={tournament.id}
      canCreate={canCreate}
      onChanged={reload}
    />
  )
}
