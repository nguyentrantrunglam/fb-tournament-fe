import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

// Chặn nếu caller không phải admin (custom claim globalRole=admin). Trả uid admin.
export function assertAdmin(req: CallableRequest): string {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập')
  if (req.auth.token['globalRole'] !== 'admin') throw new HttpsError('permission-denied', 'Chỉ admin được phép')
  return req.auth.uid
}
