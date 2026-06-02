// Map lỗi Firebase Auth / callable → thông báo tiếng Việt thân thiện
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-not-found': 'Không tìm thấy tài khoản.',
  'auth/wrong-password': 'Mật khẩu không đúng.',
  'auth/email-already-in-use': 'Email đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  'auth/popup-closed-by-user': 'Đã đóng cửa sổ đăng nhập Google.',
  'auth/too-many-requests': 'Thử lại quá nhiều lần. Vui lòng đợi chút.',
  'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối.',
  // CF completeProfile
  'already-exists': 'CCCD này đã được đăng ký.',
  'invalid-argument': 'Dữ liệu không hợp lệ.',
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code && MESSAGES[code]) return MESSAGES[code]!
  // Hiện code/message thật để dễ chẩn đoán (vd functions/not-found, functions/internal)
  const message = (err as { message?: string })?.message
  if (code) return `Lỗi: ${code}${message ? ` — ${message}` : ''}`
  if (message) return `Lỗi: ${message}`
  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}
