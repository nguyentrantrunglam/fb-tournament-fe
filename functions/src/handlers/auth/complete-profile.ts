import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (getApps().length === 0) initializeApp()
const db = getFirestore()

const CCCD_RE = /^\d{12}$/

type Payload = {
  fullName?: unknown
  cccd?: unknown
  gender?: unknown
  dob?: unknown
  phone?: unknown
}

// Signup bước 2: validate CCCD + transaction tạo users/{uid} + private/identity + cccdIndex/{cccd}.
// CCCD unique toàn hệ thống (transaction check cccdIndex).
export const completeProfile = onCall({ region: 'asia-southeast1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Cần đăng nhập')

  const { fullName, cccd, gender, dob, phone } = (req.data ?? {}) as Payload

  if (typeof fullName !== 'string' || fullName.trim().length < 2)
    throw new HttpsError('invalid-argument', 'Họ tên không hợp lệ')
  if (typeof cccd !== 'string' || !CCCD_RE.test(cccd))
    throw new HttpsError('invalid-argument', 'CCCD phải gồm đúng 12 chữ số')
  if (gender !== 'male' && gender !== 'female')
    throw new HttpsError('invalid-argument', 'Giới tính không hợp lệ')
  if (typeof dob !== 'string' || !dob) throw new HttpsError('invalid-argument', 'Ngày sinh không hợp lệ')
  const phoneVal = typeof phone === 'string' && phone ? phone : null

  const userRef = db.doc(`users/${uid}`)
  const identityRef = db.doc(`users/${uid}/private/identity`)
  const cccdRef = db.doc(`cccdIndex/${cccd}`)

  await db.runTransaction(async (tx) => {
    const [cccdSnap, userSnap] = await Promise.all([tx.get(cccdRef), tx.get(userRef)])
    if (cccdSnap.exists) throw new HttpsError('already-exists', 'CCCD đã được đăng ký')
    if (userSnap.exists) throw new HttpsError('already-exists', 'Hồ sơ đã tồn tại')

    const now = FieldValue.serverTimestamp()
    tx.set(userRef, {
      displayName: fullName.trim(),
      gender,
      dob,
      avatarUrl: null,
      globalRole: 'user',
      createdAt: now,
    })
    tx.set(identityRef, { cccd, phone: phoneVal, email: req.auth?.token.email ?? null })
    tx.set(cccdRef, { userId: uid, createdAt: now })
  })

  return { ok: true }
})
