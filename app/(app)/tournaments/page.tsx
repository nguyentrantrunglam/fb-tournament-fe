'use client'

import { RequireAuth } from '@/lib/auth/require-auth'
import { MyTournamentsClient } from './_components/MyTournamentsClient'

export default function MyTournamentsPage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <MyTournamentsClient />
    </RequireAuth>
  )
}
