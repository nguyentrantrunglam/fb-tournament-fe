import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { db } from '../lib/admin'

// Caller phải là owner của giải (hoặc admin). Trả uid caller.
export async function assertTournamentAccess(req: CallableRequest, tid: string): Promise<string> {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập')
  if (typeof tid !== 'string' || !tid) throw new HttpsError('invalid-argument', 'Thiếu tournamentId')
  const snap = await db.doc(`tournaments/${tid}`).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Giải không tồn tại')
  const isAdminRole = req.auth.token['globalRole'] === 'admin'
  if (!isAdminRole && snap.data()?.['ownerUid'] !== req.auth.uid)
    throw new HttpsError('permission-denied', 'Bạn không có quyền với giải này')
  return req.auth.uid
}

// Organizer hoặc admin mới được tạo/quản lý giải. Trả uid caller.
export function assertOrganizer(req: CallableRequest): string {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập')
  const role = req.auth.token['globalRole']
  if (role !== 'organizer' && role !== 'admin')
    throw new HttpsError('permission-denied', 'Cần quyền Tổ chức để quản lý giải')
  return req.auth.uid
}

export function isAdmin(req: CallableRequest): boolean {
  return req.auth?.token['globalRole'] === 'admin'
}
