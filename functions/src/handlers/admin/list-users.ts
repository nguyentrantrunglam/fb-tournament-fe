import { onCall } from 'firebase-functions/v2/https'
import { authAdmin, db, REGION } from '../../lib/admin'
import { assertAdmin } from '../../middleware/admin-guard'

type DocData = {
  displayName?: string
  gender?: string
  dob?: string
  globalRole?: string
  createdAt?: { toMillis?: () => number }
}

// Danh sách user cho admin: merge Auth (email) + Firestore users (profile). Admin-only.
export const adminListUsers = onCall({ region: REGION }, async (req) => {
  assertAdmin(req)

  const [authList, snap] = await Promise.all([authAdmin.listUsers(1000), db.collection('users').get()])
  const docs = new Map<string, DocData>(snap.docs.map((d) => [d.id, d.data() as DocData]))

  const users = authList.users.map((u) => {
    const d = docs.get(u.uid) ?? {}
    const role = (u.customClaims?.['globalRole'] as string | undefined) ?? d.globalRole ?? 'user'
    return {
      uid: u.uid,
      email: u.email ?? null,
      displayName: d.displayName ?? u.displayName ?? '',
      gender: d.gender ?? null,
      dob: d.dob ?? null,
      globalRole: role,
      disabled: u.disabled,
      createdAt: d.createdAt?.toMillis?.() ?? null,
    }
  })

  users.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  return { users }
})
