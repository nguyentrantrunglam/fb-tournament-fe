---
phase: 2
title: "Auth and User"
status: pending
priority: P1
effort: "3-4d"
dependencies: [1]
---

# Phase 2: Auth and User

## Overview

Build auth + user signup flow với CCCD uniqueness, profile, admin role grant. Output: VĐV signup được, admin cấp role organizer được, security rules đầu tiên enforce PII isolation.

## Requirements

**Functional:**
- Email/password signup + login (Firebase Auth).
- Google OAuth login.
- Forgot password qua email.
- Signup **2-bước**:
  - B1: Firebase Auth tạo user (email + password).
  - B2: CF `completeProfile` validate CCCD + transaction tạo `users/{uid}` + `users/{uid}/private/identity` + `cccdIndex/{cccd}`.
- Profile bắt buộc lúc signup: họ tên, **CCCD (12 số)**, giới tính (nam/nữ), ngày sinh. Tuỳ chọn: phone, avatar.
- CCCD unique toàn hệ thống (transaction-based).
- Profile edit (chỉ chính chủ + admin).
- Admin panel: list users, grant/revoke global role.

**Non-functional:**
- Signup p95 < 3s (bao gồm CF round-trip).
- CCCD index lookup < 100ms.
- Security rules deny mọi truy cập trái phép (test với emulator).

## Architecture

**Firestore layout:**
```
users/{uid}
├── (public: displayName, gender, dob, avatarUrl, globalRole, createdAt)
└── private/identity                 # subdoc fixed id
    └── { cccd, phone, email }

cccdIndex/{cccd}                      # NO client read
└── { userId, createdAt }
```

**Files:**
```
app/
├── (auth)/
│   ├── dang-nhap/page.tsx
│   ├── dang-ky/page.tsx              # 2-step form
│   ├── quen-mat-khau/page.tsx
│   └── layout.tsx
├── (app)/
│   ├── ho-so/page.tsx                # edit profile
│   └── layout.tsx                    # auth guard
└── api/auth/session/route.ts         # set session cookie sau login

lib/
├── auth/
│   ├── client.ts                     # signIn, signUp, signOut
│   ├── session.ts                    # cookie helpers
│   └── current-user.ts               # useCurrentUser hook + server helper
└── validators/
    ├── cccd.ts                       # zod 12-digit regex
    └── signup.ts                     # full signup schema

functions/src/
├── handlers/auth/
│   ├── complete-profile.ts           # signup step 2
│   ├── admin-update-cccd.ts          # P5+ stub
│   ├── grant-global-role.ts          # admin → grant 'admin'
│   └── update-profile.ts             # edit name/phone/avatar
├── domain/validation/
│   └── cccd-format.ts                # 12 số, all digits
└── middleware/
    ├── auth-guard.ts                 # check Auth token
    └── role-guard.ts                 # global + tournament role

firestore.rules                       # users + cccdIndex rules
```

## Related Code Files

- Create: tất cả ở Architecture trên
- Modify: `firestore.rules` mở rules cho users + cccdIndex
- Delete: none

## Implementation Steps

1. **Zod schema `validators/signup.ts`:**
   ```ts
   export const signupSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     displayName: z.string().min(2).max(60),
     cccd: z.string().regex(/^\d{12}$/, "CCCD phải 12 số"),
     gender: z.enum(["male", "female"]),
     dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
   })
   ```
2. **CF `complete-profile.ts`**:
   - Auth-guard: phải có auth token mới signed up.
   - Read `cccdIndex/{cccd}` trong transaction:
     - Exists → throw `CCCD_ALREADY_REGISTERED`. Client xoá auth user (rollback) → user thấy modal "đã đăng ký, đăng nhập?".
     - Not exists → tạo 3 doc: `users/{uid}`, `users/{uid}/private/identity`, `cccdIndex/{cccd}`.
   - Audit log `auth/signup` (giữ trong collection global `auditLogs/{eventId}` thay vì tournament audit).
3. **Client signup flow** (`app/(auth)/dang-ky/page.tsx`):
   - Form 1 màn duy nhất (KISS), submit:
     - `createUserWithEmailAndPassword`
     - Wait for ID token
     - Call `complete-profile` callable
     - On error CCCD: delete user.delete() + show modal
     - On success: redirect `/trang-chu`
4. **Google OAuth**:
   - `signInWithPopup(GoogleProvider)` → check `users/{uid}` exists?
     - Yes → login complete.
     - No → redirect `/dang-ky/hoan-tat` (form bổ sung CCCD + dob + gender) → call complete-profile.
5. **Session cookie**: dùng Next.js Route Handler `api/auth/session` set HTTP-only cookie chứa ID token. Middleware verify cho RSC.
6. **Profile edit page**: CF `update-profile` cho phép sửa displayName, phone, avatarUrl. KHÔNG cho sửa cccd, gender, dob (PII lock).
7. **Admin panel** `app/(app)/admin/users/page.tsx`:
   - Chỉ user có `globalRole == 'admin'` mới access (server-side check + UI guard).
   - List users (pagination 50/page), search theo email/displayName.
   - Click user → modal grant/revoke `admin` global role.
   - CF `grant-global-role` callable.
   - Bootstrap admin đầu tiên: tạo thủ công qua Firebase Console → set `globalRole: 'admin'` cho 1 user.
8. **Forgot password**: dùng Firebase Auth built-in `sendPasswordResetEmail`. Trang `/quen-mat-khau` UI gửi email.
9. **Firestore rules** (lần 1, narrow scope):
   ```
   match /users/{userId} {
     allow read: if isSignedIn();
     allow write: if false;
     match /private/{docId} {
       allow read: if uid() == userId || isAdmin();
       allow write: if false;
     }
   }
   match /cccdIndex/{cccd} {
     allow read, write: if false;
   }
   ```
10. **Firestore Rules tests** (emulator + `@firebase/rules-unit-testing`):
    - User A KHÔNG đọc được `users/{B}/private/identity`.
    - User KHÔNG ghi được `users/{uid}` trực tiếp.
    - Admin đọc được private subdoc của mọi user.
    - Anonymous đọc users root → reject.
11. **Type-safe useCurrentUser hook**: `{ user: AuthUser | null, profile: UserProfile | null, loading }`.
12. **Server helper `getCurrentUser()`**: cho RSC, verify session cookie qua Admin SDK.

## Success Criteria

- [ ] Signup form validate đủ field, error message tiếng Việt.
- [ ] CCCD duplicate: signup fail, hiển thị message rõ ràng, auth user rollback (không còn ghost auth).
- [ ] Google OAuth + complete-profile bổ sung CCCD chạy được.
- [ ] Profile page sửa được displayName/phone/avatar, KHÔNG sửa được cccd/gender/dob.
- [ ] Admin grant/revoke `admin` role hoạt động + audit log.
- [ ] 4 rules test trên emulator pass.
- [ ] Forgot password email gửi được (emulator log).
- [ ] Bundle size sau phase này: `< 250KB JS gzipped` route `/dang-ky`.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race condition 2 user đồng thời signup cùng CCCD | Transaction trên `cccdIndex/{cccd}` (atomic create-if-not-exists) |
| Firebase Auth user tạo nhưng complete-profile fail → ghost auth | Client gọi `user.delete()` trong catch; CF cũng có thể trigger cleanup |
| CCCD leak qua server response | CF projection KHÔNG trả cccd trừ khi requester = owner/admin |
| Admin bootstrap không có ai → kẹt | Document quy trình tạo admin đầu tiên qua Console |
| Session cookie XSS | HTTP-only + Secure + SameSite=Lax. Không lưu token trong localStorage. |
| Brute force CCCD enumeration | Rate limit `complete-profile` CF (5 calls/min/IP) |

## Security Considerations

- CCCD: subdoc isolation + restrict rules.
- Password min 8 chars (yêu cầu Firebase Auth default).
- Session cookie HTTP-only.
- Rate limit signup endpoint.
- Audit log mọi role change.
- Bootstrap admin: chỉ 1 lần đầu qua Console, document rõ.

## Next Steps

→ Phase 3 (Tournament and Category): admin có thể cấp role `organizer` global; organizer tạo tournament được.
