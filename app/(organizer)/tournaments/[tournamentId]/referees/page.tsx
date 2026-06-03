import { RefereeList } from './_components/RefereeList'

export default async function RefereesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return <RefereeList tournamentId={tournamentId} />
}
