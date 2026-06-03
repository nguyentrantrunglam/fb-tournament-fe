// Map api error codes → thông báo tiếng Việt thân thiện
const MESSAGES: Record<string, string> = {
  // Auth errors from NestJS api
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  INVALID_EMAIL: 'Email không hợp lệ.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản.',
  EMAIL_ALREADY_USED: 'Email đã được đăng ký.',
  NATIONAL_ID_ALREADY_REGISTERED: 'CCCD này đã được đăng ký.',
  WEAK_PASSWORD: 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  TOO_MANY_REQUESTS: 'Thử lại quá nhiều lần. Vui lòng đợi chút.',
  NETWORK_ERROR: 'Lỗi mạng. Kiểm tra kết nối.',
  BAD_RESPONSE: 'Phản hồi không hợp lệ từ máy chủ.',
  // Legacy Firebase codes kept for graceful degradation during migration
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-not-found': 'Không tìm thấy tài khoản.',
  'auth/wrong-password': 'Mật khẩu không đúng.',
  'auth/email-already-in-use': 'Email đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  'auth/too-many-requests': 'Thử lại quá nhiều lần. Vui lòng đợi chút.',
  'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối.',
  'already-exists': 'CCCD này đã được đăng ký.',
  'invalid-argument': 'Dữ liệu không hợp lệ.',
}

export function authErrorMessage(err: unknown): string {
  // ApiError from lib/api/client.ts has a `code` property
  const code = (err as { code?: string })?.code
  if (code && MESSAGES[code]) return MESSAGES[code]!
  const message = (err as { message?: string })?.message
  // NestJS validation errors surface in message
  if (message) {
    // Check if message contains known keywords for friendly mapping
    if (message.includes('EMAIL_ALREADY_USED') || message.includes('Email đã được đăng ký')) return MESSAGES['EMAIL_ALREADY_USED']!
    if (message.includes('NATIONAL_ID_ALREADY_REGISTERED') || message.includes('CCCD')) return MESSAGES['NATIONAL_ID_ALREADY_REGISTERED']!
    return `Lỗi: ${message}`
  }
  if (code) return `Lỗi: ${code}`
  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}
