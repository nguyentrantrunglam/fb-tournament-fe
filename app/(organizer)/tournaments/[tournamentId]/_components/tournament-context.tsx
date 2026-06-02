'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, onSnapshot } from 'firebase/firestore'
import { Loader2, AlertTriangle } from 'lucide-react'
import { getClientDb } from '@/lib/firebase/client'
import { mapTournamentDoc, type TournamentDoc } from '@/lib/tournaments/api'

const TournamentContext = createContext<TournamentDoc | null>(null)

// Dùng trong các trang/khu BTC — chắc chắn non-null vì Provider chỉ render con khi đã load.
export function useTournament(): TournamentDoc {
  const t = useContext(TournamentContext)
  if (!t) throw new Error('useTournament must be used within TournamentProvider')
  return t
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 px-6">{children}</div>
}

export function TournamentProvider({
  tournamentId,
  children,
}: {
  tournamentId: string
  children: React.ReactNode
}) {
  const [tournament, setTournament] = useState<TournamentDoc | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    const ref = doc(getClientDb(), 'tournaments', tournamentId)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState('notfound')
          return
        }
        setTournament(mapTournamentDoc(snap.id, snap.data()))
        setState('ok')
      },
      () => setState('error'), // permission-denied (không phải owner) hoặc lỗi mạng
    )
    return () => unsub()
  }, [tournamentId])

  if (state === 'loading') {
    return (
      <FullScreen>
        <span className="flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải giải…
        </span>
      </FullScreen>
    )
  }

  if (state !== 'ok' || !tournament) {
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-[15px] font-semibold text-white">
            {state === 'notfound' ? 'Giải không tồn tại' : 'Không có quyền truy cập giải này'}
          </p>
          <Link href="/tournaments" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors">
            Về Giải của tôi
          </Link>
        </div>
      </FullScreen>
    )
  }

  return <TournamentContext.Provider value={tournament}>{children}</TournamentContext.Provider>
}
