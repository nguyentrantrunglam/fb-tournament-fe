import { FeesQrClient } from './_components/FeesQrClient'

export default async function FeesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  const { tournamentId } = await params
  return <FeesQrClient tournamentId={tournamentId} />
}
