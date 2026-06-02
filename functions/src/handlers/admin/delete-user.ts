import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { authAdmin, db, REGION } from '../../lib/admin'
import { assertAdmin } from '../../middleware/admin-guard'

// Xoá user: Auth + users/{uid} + private/identity + cccdIndex. Admin-only, không tự xoá mình.
export const adminDeleteUser = onCall({ region: REGION }, async (req) => {
  const callerUid = assertAdmin(req)
  const { uid } = (req.data ?? {}) as { uid?: string }

  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Thiếu uid')
  if (uid === callerUid) throw new HttpsError('failed-precondition', 'Không thể tự xoá tài khoản của chính mình')

  // Lấy cccd để dọn cccdIndex
  const identitySnap = await db.doc(`users/${uid}/private/identity`).get()
  const cccd = identitySnap.data()?.['cccd'] as string | undefined

  const batch = db.batch()
  batch.delete(db.doc(`users/${uid}/private/identity`))
  batch.delete(db.doc(`users/${uid}`))
  if (cccd) batch.delete(db.doc(`cccdIndex/${cccd}`))
  await batch.commit()

  await authAdmin.deleteUser(uid).catch(() => {
    /* user Auth có thể đã bị xoá — bỏ qua */
  })
  return { ok: true }
})
