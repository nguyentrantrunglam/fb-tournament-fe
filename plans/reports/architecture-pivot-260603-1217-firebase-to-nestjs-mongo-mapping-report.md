# Architecture Pivot Mapping — Firebase → NestJS + MongoDB + Socket.IO

> **Ngày:** 2026-06-03
> **Loại:** Contract / nguồn chân lý cho việc rewrite plan + docs.
> **Trigger:** Feedback reviewer pivot toàn bộ stack khỏi Firebase/serverless sang self-host truyền thống.
> **Phạm vi áp dụng:** `docs/system-architecture.md`, `docs/project-overview-pdr.md`, `plans/260528-1255-tournament-platform-mvp/*`.

## 0. Nguyên tắc bất biến (KHÔNG đổi khi pivot)

Pivot chỉ đổi **stack hạ tầng**. Mọi **domain logic + business rule + acceptance criteria** giữ nguyên:
- D3–D40 decisions (PDR §7) — bracket auto-detect seed, gender matrix, payment tracking, category 3-state lifecycle, withdrawal cascade chỉ đụng pending/in_progress, cascade revert chain, operations console 2-cấp, schedule formula, bulk partial-commit, team photo composite, slot counter = approved+pending.
- `docs/bracket-algorithm-spec.md` — **KHÔNG đụng** (pure domain, độc lập stack).
- 18 bước acceptance criteria (PDR §10) — giữ nguyên ý nghĩa, chỉ đổi từ "Cloud Function reject" → "API reject", "Firestore realtime" → "Socket.IO".
- ERD entity fields + quan hệ — giữ, chỉ đổi storage representation + đổi tên `cccd` → `nationalId`.
- Domain layer **pure, portable** (đã là mục tiêu D2) — giờ thành hiện thực luôn: `src/domain/` trong NestJS không import nestjs/mongoose.

## 1. Bảng map stack

| Khía cạnh | CŨ (Firebase) | MỚI (self-host) |
|---|---|---|
| Backend runtime | Cloud Functions Gen 2 (HTTPS callable + triggers) | **NestJS** (Node 20 + TS), REST controllers, server persistent |
| Frontend | Next.js 15 App Router | **Next.js 15 App Router** (giữ) — repo này = `badminton-web` |
| Repo layout | single repo (app + functions/) | **2 repo:** `badminton-web` (repo này) + `badminton-api` (NestJS, repo riêng). Docs tham chiếu chéo. |
| Database | Firestore (nested subcollections) | **MongoDB + Mongoose** (collections + refs). Cần **replica set** để dùng multi-doc transaction. |
| Auth | Firebase Auth (email/pwd + Google) | **express-session + Passport** (`passport-local` bcrypt — **email/password only, KHÔNG Google OAuth**); store = `connect-mongo`; cookie `connect.sid` HTTP-only, **dùng chung REST + Socket.IO** |
| Định danh unique | `cccdIndex/{cccd}` collection + transaction | Field `nationalId` + **Mongo unique index** (`{ nationalId: 1 }, { unique: true }`) — race chống bằng duplicate-key error E11000 |
| PII isolation | subdoc `users/{uid}/private/identity` + firestore rules | `user.identity = { nationalId, phone }` + **class-serializer `@Exclude()`** mặc định; chỉ owner/admin nhận qua endpoint riêng. `email` ở root (cần cho login). |
| Authorization | `firestore.rules` (defense in depth) | **NestJS Guards**: `AuthenticatedGuard`, `RolesGuard` (global), `TournamentRoleGuard` (per-tournament). Public read = `@Public()` decorator, no-auth endpoint. |
| Write mutations | client → HTTPS callable CF | client → **REST endpoint** (controller → service → domain → repo). Client KHÔNG ghi DB trực tiếp (không còn khái niệm này — mọi ghi qua API). |
| Realtime | Firestore `onSnapshot` listener | **Socket.IO** gateway; server emit sau mutation; client subscribe room. |
| File storage | Firebase Storage SDK upload trực tiếp | **S3-compatible (DigitalOcean Spaces)** — API tạo **presigned PUT URL**, client upload thẳng lên Spaces, rồi confirm URL về API. |
| Transaction | Firestore transaction/batch (limit 500 ops) | **Mongo session transaction** (`session.withTransaction`) — không có limit 500; lo về document size 16MB + transaction runtime. |
| Hosting web | Vercel | **Vercel cho cả dev lẫn prod** (`badminton-web`). |
| Hosting api (dev) | Firebase Emulator | local / docker-compose (mongo RS 1-node + api). |
| Hosting api (prod) | Vercel + Firebase deploy | **Docker + Nginx** reverse proxy: api (NestJS+Socket.IO) + MongoDB (replica set) + Mongo session store. Spaces external. Web (Vercel) gọi api qua domain riêng → **cookie cross-origin `SameSite=None;Secure` + CORS credentials**. |
| Local dev | Firebase Emulator Suite | **docker-compose**: mongo (replica set 1 node) + api; web chạy `next dev` (hoặc Vercel preview). Spaces dùng bucket dev hoặc MinIO. |
| CI/CD | GitHub Actions + Vercel + Firebase CLI | GitHub Actions (lint/typecheck/test/build cả 2 repo) + Vercel (web) + Docker build/push + deploy script (api). |
| Cost model | Firestore free tier | **Infra tự host** (VPS + Mongo + Spaces) — không còn free-tier read/write quota; chi phí = server + bandwidth. |
| Cold start | CF cold start (risk) | **Không còn** — server luôn chạy. |

## 2. Map handler → REST endpoint (badminton-api)

Mọi `*.ts` trong `functions/src/handlers/` → controller route. Quy ước: `{HTTP} /{resource}/...`. Guard ghi kèm.

| CŨ (CF callable) | MỚI (NestJS route) | Guard |
|---|---|---|
| `auth/complete-profile` | `POST /auth/register` (gộp tạo account + profile, thu đủ field 1 lần — KHÔNG còn complete-profile vì bỏ Google) | public |
| (Firebase login) | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public / session |
| (Firebase reset) | `POST /auth/forgot-password`, `POST /auth/reset-password` (token email, nodemailer) | public |
| `auth/admin-update-cccd` | `PATCH /admin/users/:id/national-id` | RolesGuard(admin) |
| `auth/grant-global-role` | `PATCH /admin/users/:id/role` | RolesGuard(admin) |
| `auth/update-profile` | `PATCH /users/me` | authenticated |
| `tournament/create-tournament` | `POST /tournaments` | RolesGuard(admin|organizer_capable) |
| `tournament/update-tournament-detail` | `PATCH /tournaments/:tid` | TournamentRoleGuard(organizer) |
| `tournament/toggle-public` | `PATCH /tournaments/:tid/visibility` | TournamentRoleGuard(organizer) |
| `tournament/grant-tournament-role` | `POST /tournaments/:tid/roles` | TournamentRoleGuard(organizer)|admin |
| `court/create|update|delete` | `POST|PATCH|DELETE /tournaments/:tid/courts/:cid?` | TournamentRoleGuard(organizer) |
| `court/assign-referee-to-court` | `PATCH /tournaments/:tid/courts/:cid/referee` | TournamentRoleGuard(organizer) |
| `court/release-court` | `POST /tournaments/:tid/courts/:cid/release` | TournamentRoleGuard(organizer) |
| `category/create-category` | `POST /tournaments/:tid/categories` | TournamentRoleGuard(organizer) |
| `category/update-category-config` | `PATCH /categories/:cid` | TournamentRoleGuard(organizer) |
| `category/delete-category` | `DELETE /categories/:cid` | TournamentRoleGuard(organizer) |
| `category/open|close|reopen-registration` | `POST /categories/:cid/registration/{open\|close\|reopen}` | TournamentRoleGuard(organizer) |
| `category/set-schedule-config` | `POST /categories/:cid/schedule` | TournamentRoleGuard(organizer) |
| `registration/create-registration` | `POST /categories/:cid/registrations` | authenticated |
| `registration/organizer-create-registration` | `POST /categories/:cid/registrations/organizer` | TournamentRoleGuard(organizer) |
| `registration/organizer-bulk-create` | `POST /tournaments/:tid/registrations/bulk` | TournamentRoleGuard(organizer) |
| `registration/approve|reject` | `POST /registrations/:rid/{approve\|reject}` | TournamentRoleGuard(organizer) |
| `registration/withdraw` | `POST /registrations/:rid/withdraw` | authenticated (owner) | organizer |
| `registration/mark-paid|unmark-paid` | `POST /registrations/:rid/{mark-paid\|unmark-paid}` | TournamentRoleGuard(organizer) |
| `registration/set-registration-seed` | `PATCH /registrations/:rid/seed` | TournamentRoleGuard(organizer) |
| `registration/upload-team-photo` | `POST /storage/presign` + `PATCH /registrations/:rid/team-photo` | TournamentRoleGuard(organizer) |
| `bracket/draw-bracket` | `POST /categories/:cid/bracket/draw` | TournamentRoleGuard(organizer) |
| `bracket/rearrange-bracket` | `POST /categories/:cid/bracket/rearrange` | TournamentRoleGuard(organizer) |
| `bracket/reset-bracket` | `POST /categories/:cid/bracket/reset` | TournamentRoleGuard(organizer)|admin |
| `match/start-match` | `POST /matches/:mid/start` | referee(snapshot)|organizer |
| `match/record-game-score` | `POST /matches/:mid/games` | referee(snapshot)|organizer |
| `match/end-match` | `POST /matches/:mid/end` | referee(snapshot)|organizer |
| `match/edit-score` | `PATCH /matches/:mid/score` | referee(24h)|organizer(anytime) |
| `match/preview-cascade-revert` | `POST /matches/:mid/score/preview-cascade` | referee|organizer |
| `match/assign-match-to-court` | `POST /matches/:mid/assign-court` | TournamentRoleGuard(organizer) |
| (mockup) `reorderMatches` | `PATCH /categories/:cid/matches/order` | TournamentRoleGuard(organizer) |
| (public reads) | `GET /public/...` (xem §4) | `@Public()` |

## 3. Map storage (Firestore subcollections → Mongo collections)

Bỏ cây subcollection. Dùng collections phẳng + ref ObjectId. Embedding cho dữ liệu bounded.

| Collection | Ghi chú |
|---|---|
| `users` | `{ _id, email(unique), passwordHash, displayName, gender, dob, avatarUrl, globalRole, identity:{nationalId(unique), phone}, createdAt }`. `globalRole`: `athlete`(default) \| `organizer_capable` \| `admin`. (`athlete` = "VĐV", thay cho `user` cũ.) |
| `tournaments` | entity Tournament + `slug`(unique) + `ownerUserId` ref. sponsors[] + paymentConfig embedded. |
| `tournamentRoles` | `{ _id, tournamentId, userId, role: organizer\|referee, grantedAt, grantedByUserId }`; compound unique `{tournamentId, userId, role}`. |
| `courts` | `{ _id, tournamentId, name, currentRefereeUserId, currentMatchId, status, refereeAssignedAt }`. |
| `categories` | entity Category, ref tournamentId; compound unique `{tournamentId, code}`. |
| `registrations` | entity Registration, ref categoryId + tournamentId(denormalize) + userId + partnerUserId. |
| `brackets` | `{ _id, categoryId, version, isActive, drawnAt, drawnByUserId }`. |
| `matches` | entity Match. **EMBED** `sides: { A: SideObj, B: SideObj }` + `games: GameObj[]` (bounded ≤ bestOf=5). Giữ denormalize `participantUserIds[]`, `participantRegistrationIds[]` cho query. `courtId`, `refereeUserId`(snapshot), `nextMatchId`, `order`, `scheduledAt`. |
| `auditLogs` | `{ _id, tournamentId?, type, actorUserId, payload, at }` immutable (không update/delete ở service). |

**Quyết định embed sides+games vào match:** sides luôn 2, games ≤5 → bounded, không vượt 16MB. Lợi: 1 transaction đụng 1 doc/match, Socket.IO emit nguyên match doc. Ảnh hưởng: `sideId` cũ → `'A'/'B'` discriminator trong match; domain layer vốn thao tác trên plain object (BracketPlan) nên không đổi chữ ký, chỉ adapter map khác.

**Indexes cần:** `users.email`(unique), `users.identity.nationalId`(unique), `tournaments.slug`(unique), `{tournamentRoles: tournamentId+userId+role}`(unique), `{registrations: categoryId+status}`, `{registrations: userId}`, `{matches: bracketId}`, `{matches: participantUserIds}`, `{matches: categoryId+round+slotIndex}`, `{categories: tournamentId+code}`(unique), `{auditLogs: tournamentId+at}`.

## 4. Public read (no-auth) — thay public firestore rules

Module `public/` với `@Public()`:
- `GET /public/tournaments?status=` — list isPublic=true.
- `GET /public/tournaments/:slug` — detail (isPublic only).
- `GET /public/tournaments/:slug/categories/:code` — category + roster (roster CHỈ khi `registrationStatus=closed`).
- `GET /public/tournaments/:slug/categories/:code/bracket` — active bracket + matches (đã ẩn PII).
- `GET /public/tournaments/:slug/schedule`.
Serializer đảm bảo KHÔNG leak `identity.nationalId`/`phone`/`email`. Guard logic của old rules (isPublic, roster-public-when-closed, PII) chuyển vào **service query + serializer**.

## 5. Realtime (Socket.IO) — thay onSnapshot

- Gateway namespace mặc định `/`. Rooms: `tournament:{tid}`, `category:{cid}`, `match:{mid}`.
- Client public join room không cần auth (read-only). Socket.IO middleware share express-session để biết user (cho referee scoring nếu cần).
- Server emit sau khi service commit transaction:
  - `match:updated` (payload: match doc đã serialize) → room `category:{cid}` + `match:{mid}`.
  - `bracket:updated` → room `category:{cid}`.
  - `registration:updated` → room `tournament:{tid}` (organizer console).
  - `court:updated` → room `tournament:{tid}` (operations console).
- Latency target < 3s giữ nguyên (giờ thực ra < 1s vì push trực tiếp).

## 6. NestJS module skeleton (badminton-api)

```
src/
├── main.ts                  # session middleware, SocketIoAdapter, CORS credentials, helmet
├── app.module.ts            # MongooseModule.forRoot(replicaSet), ConfigModule, ThrottlerModule
├── common/{guards,decorators,interceptors,filters}
├── domain/                  # PURE (no nest/mongoose): bracket/, scoring/, validation/
├── schemas/                 # Mongoose schemas (xem §3)
├── modules/
│   ├── auth/                # local strategy, session serializer, register/login/logout/forgot
│   ├── users/  tournaments/  courts/  categories/  registrations/
│   ├── brackets/  matches/  operations/  (court-assign + schedule)
│   ├── storage/             # S3 presign (DO Spaces, @aws-sdk/client-s3 + s3-request-presigner)
│   ├── realtime/            # Socket.IO gateway
│   └── public/              # @Public() read endpoints
└── config/
```
- `domain/` = copy nguyên `functions/src/domain/` cũ. Đổi `cccd-format.ts` → `national-id-format.ts`. 0 import hạ tầng (lint rule giữ).
- Repo/adapter cũ `adapters/firestore/*` → service Mongoose hoặc `*.repository.ts` dùng `@InjectModel`.

## 7. Rename / terminology

- `cccd` → `nationalId` (field, validator, error code `NATIONAL_ID_ALREADY_REGISTERED`). UI tiếng Việt vẫn hiển thị "CCCD".
- `uid` (Firebase) → `userId` (Mongo ObjectId string).
- `refereeUid` → `refereeUserId`; `ownerUid` → `ownerUserId`; các `*Uid` → `*UserId`.
- `globalRole: user` → `globalRole: athlete`.
- "Cloud Function" / "CF" → "API endpoint" / "service".
- "Firestore listener" → "Socket.IO".
- "Firebase Storage" → "DigitalOcean Spaces (S3)".
- "Firestore rules / emulator rules test" → "Guard + e2e auth test (Jest + supertest)".

## 8. Testing map

| CŨ | MỚI |
|---|---|
| Vitest unit (domain) | **Jest unit** (domain) — pure, gần như copy. |
| `@firebase/rules-unit-testing` emulator | **supertest e2e** đánh vào NestJS test app + mongodb-memory-server (replica set) — test guard/authz. |
| CF integration (emulator) | **Jest e2e** module test với mongodb-memory-server. |
| Playwright E2E (Vercel preview) | **Playwright E2E** (web Vercel preview/next dev + api qua docker-compose). |

## 9. Việc MỚI phát sinh do pivot (không có ở plan Firebase)

1. **Password hashing** (bcrypt) + reset-token flow (Firebase Auth lo trước đây).
2. **Session store** (connect-mongo) + cấu hình cookie shared cross-origin (CORS `credentials`, `SameSite`, domain).
3. **Mongo replica set** (bắt buộc cho transaction) — dev qua docker-compose 1-node RS; prod RS thật.
4. **S3 presign service** + CORS bucket config trên Spaces.
5. **Socket.IO adapter** + session-share middleware + (prod multi-instance → Redis adapter, ghi chú P5+).
6. **Nginx reverse proxy** config (route /api, /socket.io, / ; websocket upgrade headers).
7. **Dockerfile** cho api (web ở Vercel, không dockerize); docker-compose dev cho api + mongo RS.
8. Web đổi data layer: Firestore SDK hooks → **REST (TanStack Query) + Socket.IO client**; bỏ `lib/firebase/*`, thêm `lib/api/*` + `lib/socket.ts`.

## 10. Resolved decisions (user xác nhận 2026-06-03)

- ✅ **Spaces**: 1 bucket, prefix `tournaments/{tid}/...`. (confirmed)
- ✅ **Auth**: chỉ email/password qua API session — **bỏ Google OAuth** hoàn toàn (không passport-google-oauth20, không endpoint `/auth/google`, không complete-profile). `POST /auth/register` thu đủ field 1 lần.
- ✅ **Web hosting**: **Vercel cho cả dev + prod**. Docker + Nginx chỉ cho `badminton-api` + Mongo. Web (Vercel domain) ↔ api (domain riêng) = cross-origin → cookie `SameSite=None;Secure` + CORS `credentials:true`.

Còn để ngỏ:
- Multi-instance Socket.IO scaling (Redis adapter) — defer P5+, MVP single instance.
