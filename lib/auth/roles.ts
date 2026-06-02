// globalRole lưu ở Firestore users/{uid}.globalRole + custom claim (cho route guard).
//   admin     — quản trị hệ thống, cấp quyền, quản lý mọi giải
//   organizer — được admin cấp; tạo & tự quản lý giải của mình
//   user      — VĐV / người dùng thường
export type GlobalRole = 'admin' | 'organizer' | 'user'

export const ROLE_LABEL: Record<GlobalRole, string> = {
  admin: 'Admin',
  organizer: 'Tổ chức',
  user: 'Người dùng',
}

// Quyền vào khu Ban tổ chức (quản lý giải)
export function canManageTournaments(role: GlobalRole | null): boolean {
  return role === 'organizer' || role === 'admin'
}

// Sau đăng nhập điều hướng theo quyền
export function landingPath(role: GlobalRole | null): string {
  return role === 'admin' ? '/admin' : '/'
}
