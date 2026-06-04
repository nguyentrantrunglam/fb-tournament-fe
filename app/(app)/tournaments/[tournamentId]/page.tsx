'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { fetchTournament, fetchCategories } from '@/lib/tournaments/api'
import { useCurrentUser } from '@/lib/auth/auth-provider'
import { SelfRegisterForm } from '@/components/registration/self-register-form'
import type { TournamentDoc } from '@/lib/tournaments/api'
import type { CategoryWithStats } from '@/lib/types/category'

export default function ParticipantTournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { user } = useCurrentUser()
  const router = useRouter()

  const [tournament, setTournament] = useState<TournamentDoc | null>(null)
  const [categories, setCategories] = useState<CategoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [registerCat, setRegisterCat] = useState<CategoryWithStats | null>(null)

  useEffect(() => {
    Promise.all([fetchTournament(tournamentId), fetchCategories(tournamentId)])
      .then(([t, cats]) => { setTournament(t); setCategories(cats) })
      .finally(() => setLoading(false))
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center gap-2 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
        Không tìm thấy giải.{' '}
        <Link href="/" className="ml-2 text-orange-400 hover:text-orange-300 underline">Về trang chủ</Link>
      </div>
    )
  }

  const openCategories = categories.filter((c) => c.registrationStatus === 'open')

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Tournament header */}
        <div>
          <h1 className="text-[22px] font-bold">{tournament.name}</h1>
          <p className="text-[13px] text-zinc-500 mt-1">{tournament.location}</p>
        </div>

        {/* Open categories — registration section */}
        <section>
          <h2 className="text-[15px] font-semibold mb-3">Hạng mục đang mở đăng ký</h2>
          {openCategories.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Chưa có hạng mục nào đang mở đăng ký.</p>
          ) : (
            <div className="space-y-2">
              {openCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <div>
                    <p className="text-[14px] font-medium text-white">{cat.name}</p>
                    <p className="text-[12px] text-zinc-500 mt-0.5">
                      {cat.playerCount === 1 ? 'Đơn' : 'Đôi'} ·{' '}
                      {cat.fee > 0 ? `${Math.round(cat.fee / 1000)}k` : 'Miễn phí'} ·{' '}
                      {cat.slotFilled}/{cat.maxTeams} đội
                    </p>
                  </div>
                  {user ? (
                    <button
                      onClick={() => setRegisterCat(cat)}
                      className="px-3 py-1.5 text-[13px] font-medium bg-orange-500 hover:bg-orange-400 text-white rounded-md transition-colors"
                    >
                      Đăng ký
                    </button>
                  ) : (
                    <Link
                      href={`/login?redirect=/tournaments/${tournamentId}`}
                      className="px-3 py-1.5 text-[13px] font-medium border border-zinc-700 text-zinc-300 hover:text-white rounded-md transition-colors"
                    >
                      Đăng nhập để đăng ký
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Self-register dialog */}
      {registerCat && user && (
        <SelfRegisterForm
          open={!!registerCat}
          onOpenChange={(v) => !v && setRegisterCat(null)}
          tournamentId={tournamentId}
          category={registerCat}
          currentUser={user}
          onRegistered={() => setRegisterCat(null)}
        />
      )}
    </div>
  )
}
