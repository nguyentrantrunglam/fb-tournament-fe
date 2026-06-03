// GlobalRole values mirror the api session — 'athlete' is the default (was 'user' in Firebase).
//   admin              — quản trị hệ thống, cấp quyền, quản lý mọi giải
//   organizer_capable  — được admin cấp; tạo & tự quản lý giải của mình
//   athlete            — VĐV / người dùng thường (default)
export type GlobalRole = 'admin' | 'organizer_capable' | 'athlete'

export const ROLE_LABEL: Record<GlobalRole, string> = {
  admin: 'Admin',
  organizer_capable: 'Tổ chức',
  athlete: 'Người dùng',
}

// Quyền vào khu Ban tổ chức (quản lý giải)
export function canManageTournaments(role: GlobalRole | null): boolean {
  return role === 'organizer_capable' || role === 'admin'
}

// Sau đăng nhập điều hướng theo quyền
export function landingPath(role: GlobalRole | null): string {
  if (role === 'admin') return '/admin'
  if (role === 'organizer_capable') return '/tournaments'
  return '/'
}
