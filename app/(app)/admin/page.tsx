'use client'

import { RequireAuth } from '@/lib/auth/require-auth'
import { AdminUsersClient } from './_components/AdminUsersClient'

export default function AdminPage() {
  return (
    <RequireAuth roles={['admin']}>
      <AdminUsersClient />
    </RequireAuth>
  )
}
