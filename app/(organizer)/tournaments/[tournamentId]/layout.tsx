import { TournamentSidebar } from './_components/TournamentSidebar'
import { TournamentHeader } from './_components/TournamentHeader'
import { TournamentProvider } from './_components/tournament-context'
import { RequireAuth } from '@/lib/auth/require-auth'

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params

  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <TournamentProvider tournamentId={tournamentId}>
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
          <TournamentSidebar tournamentId={tournamentId} />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <TournamentHeader tournamentId={tournamentId} />
            <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
          </div>
        </div>
      </TournamentProvider>
    </RequireAuth>
  )
}
