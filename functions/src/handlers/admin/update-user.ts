import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { authAdmin, db, REGION } from '../../lib/admin'
import { assertAdmin } from '../../middleware/admin-guard'

// Sửa thông tin user (displayName, phone). KHÔNG cho sửa CCCD/gender/dob (PII lock). Admin-only.
export const adminUpdateUser = onCall({ region: REGION }, async (req) => {
  assertAdmin(req)
  const { uid, displayName, phone } = (req.data ?? {}) as {
    uid?: string
    displayName?: string
    phone?: string
  }

  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Thiếu uid')
  if (typeof displayName !== 'string' || displayName.trim().length < 2)
    throw new HttpsError('invalid-argument', 'Họ tên không hợp lệ')
  const phoneVal = typeof phone === 'string' && phone ? phone : null

  await db.doc(`users/${uid}`).set({ displayName: displayName.trim() }, { merge: true })
  await db.doc(`users/${uid}/private/identity`).set({ phone: phoneVal }, { merge: true })
  await authAdmin.updateUser(uid, { displayName: displayName.trim() })
  return { ok: true }
})
