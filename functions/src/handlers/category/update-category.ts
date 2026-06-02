import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, REGION } from '../../lib/admin'
import { assertTournamentAccess } from '../../middleware/role-guard'

const GENDERS = ['men_only', 'women_only', 'mixed_pair', 'unrestricted']

type Payload = {
  tournamentId?: unknown
  categoryId?: unknown
  code?: unknown
  name?: unknown
  playerCount?: unknown
  genderRequirement?: unknown
  bestOf?: unknown
  fee?: unknown
  maxTeams?: unknown
  registrationDeadline?: unknown
}

// Sửa hạng mục. Owner/admin. format giữ nguyên (không đổi qua đây).
export const updateCategory = onCall({ region: REGION }, async (req) => {
  const d = (req.data ?? {}) as Payload
  const tid = String(d.tournamentId ?? '')
  const cid = String(d.categoryId ?? '')
  await assertTournamentAccess(req, tid)
  if (!cid) throw new HttpsError('invalid-argument', 'Thiếu categoryId')

  const code = String(d.code ?? '').trim().toUpperCase()
  const name = String(d.name ?? '').trim()
  const playerCount = d.playerCount === 2 ? 2 : 1
  const gender = String(d.genderRequirement ?? '')
  const bestOf = [1, 3, 5].includes(d.bestOf as number) ? (d.bestOf as number) : 3
  const fee = Math.max(0, Math.floor(Number(d.fee) || 0))
  const maxTeams = Math.max(2, Math.min(256, Math.floor(Number(d.maxTeams) || 2)))
  const deadline = String(d.registrationDeadline ?? '')

  if (!/^[A-Z0-9_-]{2,12}$/.test(code)) throw new HttpsError('invalid-argument', 'Mã hạng mục không hợp lệ')
  if (name.length < 1) throw new HttpsError('invalid-argument', 'Thiếu tên hạng mục')
  if (!GENDERS.includes(gender)) throw new HttpsError('invalid-argument', 'Giới tính không hợp lệ')
  if (gender === 'mixed_pair' && playerCount === 1)
    throw new HttpsError('invalid-argument', 'Nam-nữ chỉ áp dụng nội dung đôi')
  if (!deadline) throw new HttpsError('invalid-argument', 'Thiếu hạn đăng ký')

  const ref = db.doc(`tournaments/${tid}/categories/${cid}`)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Hạng mục không tồn tại')

  await ref.set(
    { code, name, playerCount, genderRequirement: gender, bestOf, fee, maxTeams, registrationDeadline: deadline },
    { merge: true },
  )
  return { ok: true }
})
