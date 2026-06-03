import { CourtBoard } from './_components/CourtBoard'

export default async function CourtsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return <CourtBoard tournamentId={tournamentId} />
}
