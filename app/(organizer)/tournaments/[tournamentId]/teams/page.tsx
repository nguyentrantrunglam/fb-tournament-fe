import { TeamsClient } from './_components/TeamsClient'

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return <TeamsClient tournamentId={tournamentId} />
}
