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

Build auth + user register flow với nationalId uniqueness, profile, admin role grant. Output: VĐV register được (bcrypt + session), admin cấp role organizer được, guards đầu tiên enforce PII isolation.

**Strangler — feature đầu tiên được chuyển khỏi Firebase:** web đã có `(auth)/login`, `(auth)/register`, `lib/auth/*` (Firebase). Phase này **rewire chúng sang API session** (qua `lib/api/auth.ts`) và **gỡ phần auth Firebase** (`lib/auth/client.ts` Firebase, firebase Auth init dùng cho login/register). Các feature Firebase khác (tournaments/courts/fees/referees) GIỮ nguyên cho đến phase tương ứng. Sau phase này, `middleware.ts`/`require-auth` đọc session API thay vì Firebase token.

## Requirements

**Functional:**
- Email/password register + login (Passport local + bcrypt + express-session). **KHÔNG Google OAuth** — auth 100% qua API.
- Forgot password qua email (token + SMTP/nodemailer, không còn provider built-in).
- Register: 1 endpoint `POST /auth/register` gộp tạo account + profile (bcrypt hash + insert user + auto-login session), thu đủ field 1 lần (không cần complete-profile).
- Profile bắt buộc lúc register: họ tên, **nationalId (12 số)**, giới tính (nam/nữ), ngày sinh. Tuỳ chọn: phone, avatar.
- nationalId unique toàn hệ thống (Mongo unique index `users.identity.nationalId`).
- Profile edit (chỉ chính chủ + admin).
- Admin panel: list users, grant/revoke global role.

**Non-functional:**
- Register p95 < 3s (bao gồm API round-trip + bcrypt).
- nationalId uniqueness check ở tầng DB (unique index, atomic).
- Guards deny mọi truy cập trái phép (test với supertest + mongodb-memory-server).

## Architecture

**MongoDB layout (collection `users`):**
```
users
└── { _id, email(unique), passwordHash?, displayName, gender, dob, avatarUrl,
      globalRole: 'athlete'|'organizer_capable'|'admin',
      identity: { nationalId(unique idx), phone },   # @Exclude() mặc định (serializer)
      createdAt }
```
- `email` ở root (cần cho login). `identity.nationalId` + `phone` = PII, `@Exclude()` mặc định, chỉ owner/admin nhận qua endpoint riêng.
- Unique index `{ 'identity.nationalId': 1 }` thay cho collection `cccdIndex` + transaction cũ.

**`badminton-web` files:**
```
app/
├── (auth)/
│   ├── login/page.tsx                # route tiếng Anh (đồng nhất toàn app)
│   ├── register/page.tsx             # register form
│   ├── forgot-password/page.tsx
│   └── layout.tsx
├── (app)/
│   ├── ho-so/page.tsx                # edit profile
│   ├── admin/users/page.tsx          # admin user list + grant role
│   └── layout.tsx                    # auth guard (đọc GET /auth/me)
└── api/                              # route handlers (proxy cookie nếu cần SSR)

lib/
├── api/
│   ├── auth.ts                       # login/logout/register/me (REST, credentials:'include')
│   └── users.ts                      # profile, admin user list, grant role
└── validators/
    ├── national-id.ts                # zod 12-digit regex
    └── signup.ts                     # full register schema
```

**`badminton-api` files (NestJS):**
```
src/
├── modules/auth/
│   ├── auth.controller.ts            # register/login/logout/me/forgot/reset
│   ├── auth.service.ts               # bcrypt, session, reset-token
│   ├── local.strategy.ts             # passport-local (email + bcrypt.compare)
│   └── session.serializer.ts         # serialize userId → session
├── modules/users/
│   ├── users.controller.ts           # PATCH /users/me; admin list + grant role
│   └── users.service.ts
├── domain/validation/national-id-format.ts   # 12 số, all digits (đổi tên từ cccd-format)
├── common/guards/{authenticated,roles}.guard.ts
├── common/decorators/{public,roles,current-user}.ts
└── schemas/user.schema.ts            # @Prop identity subdoc + index unique
```

## Related Code Files

- Create (api): toàn bộ Architecture api trên. Create (web): `lib/api/auth.ts`, `lib/api/users.ts`, `lib/validators/{national-id,signup}.ts`, `useCurrentUser` hook.
- Modify (web): `(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `(auth)/forgot-password/page.tsx`, `(app)/admin/users/page.tsx`, `(app)/layout.tsx`, `middleware.ts`/`lib/auth/require-auth.tsx` — rewire Firebase → API session.
- Modify (api): `common/guards/*` (implement `AuthenticatedGuard`, `RolesGuard` từ stub P1), serialize interceptor (exclude `identity`/`email`).
- Delete (web, strangler — chỉ phần auth): `lib/auth/client.ts` (Firebase auth), `lib/auth/auth-error.ts` (Firebase), Firebase Auth init nếu chỉ dùng cho auth. **Giữ** `lib/firebase` core nếu feature Firebase khác còn dùng.

## Implementation Steps

1. **Zod schema `validators/signup.ts` (web, share shape với API DTO):**
   ```ts
   export const signupSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     displayName: z.string().min(2).max(60),
     nationalId: z.string().regex(/^\d{12}$/, "CCCD phải 12 số"),
     gender: z.enum(["male", "female"]),
     dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
   })
   ```
   (UI vẫn hiển thị label tiếng Việt "CCCD".)
2. **`POST /auth/register` (api auth.service)**:
   - Validate DTO (class-validator), nationalId 12 số (`national-id-format.ts`).
   - `bcrypt.hash` password.
   - Insert `users { ..., identity: { nationalId, phone } }`.
     - Unique index `{ 'identity.nationalId': 1 }`: trùng → Mongo `E11000` → map `NATIONAL_ID_ALREADY_REGISTERED` (KHÔNG cần transaction/đọc-trước).
     - email trùng → `E11000` → `EMAIL_ALREADY_USED`.
   - Tạo session (auto-login) → set cookie `connect.sid`.
   - Audit log `auth/signup` (collection `auditLogs`).
3. **Client register flow** (`app/(auth)/register/page.tsx`):
   - Form 1 bước (email/password/confirm + họ tên, CCCD 12 số, giới tính, ngày sinh, phone optional). Submit:
     - `POST /auth/register` (credentials:'include').
     - On error `NATIONAL_ID_ALREADY_REGISTERED`: hiển thị modal "CCCD này đã được đăng ký. Vui lòng đăng nhập hoặc dùng quên mật khẩu." (KHÔNG tiết lộ email/owner cũ — không còn ghost auth vì không tạo account tách rời).
     - On success: cookie set → redirect `/`.
4. **Login / logout / me:** `POST /auth/login` (Passport local, bcrypt.compare) → session cookie; `POST /auth/logout` destroy session; `GET /auth/me` trả `{ user }` (đã loại PII qua serializer).
5. **Session config**: cookie `connect.sid` HTTP-only + `SameSite=None;Secure` (web Vercel ↔ api domain riêng = cross-origin); CORS `credentials:true` origin = web domain; store `connect-mongo`.
6. **Profile edit**: `PATCH /users/me` cho phép sửa displayName, phone, avatarUrl. KHÔNG cho sửa nationalId, gender, dob (PII lock).
7. **Admin panel** `app/(app)/admin/users/page.tsx`:
   - Chỉ user `globalRole == 'admin'` access (server-side check qua `GET /auth/me` + `RolesGuard` ở api).
   - List users (pagination 50/page), search theo email/displayName.
   - Click user → modal grant/revoke role.
   - `PATCH /admin/users/:id/role` (RolesGuard admin).
   - Bootstrap admin đầu tiên: tạo thủ công (seed script / Mongo shell) → set `globalRole: 'admin'` cho 1 user.
8. **Forgot password (custom flow)**: `POST /auth/forgot-password` sinh token (hash lưu DB, TTL 1h) + gửi email qua nodemailer/SMTP; `POST /auth/reset-password { token, newPassword }` verify token + bcrypt hash mới. Trang `/forgot-password` UI gửi email.
9. **Guards (thay firestore.rules)**:
   - `AuthenticatedGuard`: `req.isAuthenticated()` (session) — chặn nếu chưa login.
   - `RolesGuard('admin')`: đọc `req.user.globalRole`.
   - `users` read: service projection loại `identity` cho non-owner; `GET /users/me` + `GET /admin/users/:id` (admin) mới trả `identity`.
   - Mọi mutation `users` chỉ qua endpoint có guard (không có "client ghi DB trực tiếp").
10. **Guard / authz tests (supertest + mongodb-memory-server, thay rules-unit-testing)**:
    - User A `GET /admin/users/:B` → 403 (không phải admin) → KHÔNG nhận `identity` của B.
    - User KHÔNG sửa được profile user khác (`PATCH /users/me` chỉ chính chủ).
    - Admin `GET /admin/users/:id` → nhận `identity` của mọi user.
    - Anonymous `GET /auth/me` → 401.
    - Register trùng nationalId → 409 `NATIONAL_ID_ALREADY_REGISTERED`.
11. **Type-safe useCurrentUser hook (web)**: `{ user: AuthUser | null, loading }` — fetch `GET /auth/me` qua TanStack Query.
12. **Server helper `getCurrentUser()` (RSC)**: forward cookie `connect.sid` tới `GET /auth/me`.

## Success Criteria

- [ ] Register form validate đủ field, error message tiếng Việt.
- [ ] nationalId duplicate: register fail 409, hiển thị message rõ ràng (không tiết lộ owner cũ).
- [ ] Session cookie cross-origin (web Vercel ↔ api) gửi/nhận đúng (SameSite=None;Secure + CORS credentials).
- [ ] Profile page sửa được displayName/phone/avatar, KHÔNG sửa được nationalId/gender/dob.
- [ ] Admin grant/revoke `admin` role hoạt động + audit log.
- [ ] 5 guard/authz tests (supertest) pass.
- [ ] Forgot password email gửi được (SMTP dev log).
- [ ] Bundle size sau phase này: `< 250KB JS gzipped` route `/register`.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race 2 user đồng thời register cùng nationalId | Mongo unique index `users.identity.nationalId` (atomic ở tầng DB, E11000) — không còn race window đọc-rồi-ghi |
| Password lưu plaintext | bcrypt hash (cost ≥ 10); không log raw password |
| nationalId leak qua API response | `@Exclude()` `identity` mặc định; service projection; chỉ owner/admin nhận qua endpoint riêng |
| Admin bootstrap không có ai → kẹt | Document quy trình tạo admin đầu tiên qua seed script / Mongo shell |
| Session cookie XSS / CSRF | HTTP-only + Secure + SameSite; CORS credentials origin whitelist; không lưu token localStorage |
| Brute force nationalId enumeration / login | Rate limit (ThrottlerModule) `auth/*` (5 calls/min/IP) |
| Reset token bị đoán/replay | Token random + hash lưu DB + TTL 1h + single-use |

## Security Considerations

- nationalId: `identity` subdoc + `@Exclude()` serializer + service projection.
- Password min 8 chars + bcrypt hash.
- Session cookie HTTP-only + Secure + SameSite; store connect-mongo (TTL).
- Rate limit register/login/forgot endpoints (ThrottlerModule).
- Audit log mọi role change.
- Bootstrap admin: chỉ 1 lần đầu qua seed script, document rõ.
- KHÔNG log raw nationalId / password vào access log.

## Next Steps

→ Phase 3 (Tournament and Category): admin cấp `organizer_capable` global flag; organizer tạo tournament được.
