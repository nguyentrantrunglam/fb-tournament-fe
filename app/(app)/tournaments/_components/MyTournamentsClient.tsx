'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeft, LogOut, Loader2, Trophy } from 'lucide-react'
import { signOut } from '@/lib/auth/client'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { listMyTournaments, type MyTournament } from '@/lib/tournaments/api'
import { TournamentHeroCard } from '@/components/tournament-hero-card'
import { CreateTournamentDialog } from './CreateTournamentDialog'

export function MyTournamentsClient() {
  const router = useRouter()
  const [list, setList] = useState<MyTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    listMyTournaments()
      .then(setList)
      .catch((e) => setError(authErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold">Giải của tôi</h1>
            <p className="text-[12px] text-zinc-500">{list.length} giải bạn quản lý</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors">
              <Plus className="w-4 h-4" /> Tạo giải
            </button>
            <button onClick={async () => { await signOut(); router.replace('/login') }} className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-md transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
          </div>
        ) : list.length === 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 hover:border-zinc-500 py-20 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <Trophy className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-zinc-300 group-hover:text-white">Tạo giải đầu tiên</p>
              <p className="text-[12px] text-zinc-600 mt-0.5">Bắt đầu tổ chức giải cầu lông của bạn</p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((t) => {
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}/tournament-info`}
                  className="block rounded-xl ring-1 ring-transparent hover:ring-zinc-600 transition-all"
                >
                  <TournamentHeroCard
                    name={t.name}
                    location={t.location}
                    startDate={t.startDate}
                    endDate={t.endDate}
                    status={t.status}
                    bannerUrl={t.bannerUrl}
                    logoUrl={t.logoUrl}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <CreateTournamentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/tournaments/${id}/tournament-info`)}
      />
    </div>
  )
}
