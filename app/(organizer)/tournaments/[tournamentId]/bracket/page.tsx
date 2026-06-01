import { BracketClient } from './_components/BracketClient'
import { MOCK_BRACKETS } from './_components/mock-bracket-data'

export default async function BracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>
}) {
  await params
  return <BracketClient categories={MOCK_BRACKETS} />
}
