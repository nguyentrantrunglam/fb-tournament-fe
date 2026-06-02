import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { authAdmin, db, REGION } from '../../lib/admin'
import { assertAdmin } from '../../middleware/admin-guard'

// Cấp/thu hồi quyền admin: set custom claim + users/{uid}.globalRole. Admin-only.
export const adminSetGlobalRole = onCall({ region: REGION }, async (req) => {
  const callerUid = assertAdmin(req)
  const { uid, role } = (req.data ?? {}) as { uid?: string; role?: string }

  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Thiếu uid')
  if (role !== 'admin' && role !== 'organizer' && role !== 'user')
    throw new HttpsError('invalid-argument', 'Quyền không hợp lệ')
  if (uid === callerUid && role !== 'admin')
    throw new HttpsError('failed-precondition', 'Không thể tự thu hồi quyền admin của chính mình')

  await authAdmin.setCustomUserClaims(uid, { globalRole: role })
  await db.doc(`users/${uid}`).set({ globalRole: role }, { merge: true })
  return { ok: true }
})
