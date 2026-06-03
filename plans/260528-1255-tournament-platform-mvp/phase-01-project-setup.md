---
phase: 1
title: "Project Setup"
status: done
priority: P1
effort: "2-3d"
dependencies: []
---

# Phase 1: Project Setup

## Overview

**Realiy check (2026-06-03):** `badminton-web` (repo này) **đã tồn tại** — Next.js 16 + yarn + Firebase, đã build nhiều feature (tournaments/courts/fees/referees). Pivot dùng **chiến lược strangler**: KHÔNG xoá Firebase ngay; Phase 01 chỉ **thêm lớp REST/Socket client** (`lib/api`, `lib/socket.ts`) + env trỏ api, giữ web chạy được. Code Firebase từng feature sẽ gỡ dần ở phase sau khi api có endpoint thay thế.

Scaffold mới repo `badminton-api` (NestJS, pnpm) tại **`/Users/trunglam/Personal/badminton-api`** (git init riêng). Output: web vẫn chạy + có `lib/api`/`lib/socket`; api chạy local qua docker-compose (mongo replica-set 1-node + api), web gọi được `GET /health` qua REST + connect Socket.IO.

**Tooling đã chốt:** web = **yarn + Next 16** (giữ nguyên); api = **pnpm + Node 20**.

## Requirements

**Functional:**
- `badminton-web` (đã có): thêm `lib/api/` (REST fetch client, credentials) + `lib/socket.ts` (socket.io-client) + env `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SOCKET_URL`. Giữ Firebase (strangler) — KHÔNG xoá.
- NestJS `badminton-api` scaffold xong (pnpm): REST controller, Socket.IO gateway bootstrap, express-session + connect-mongo, helmet, CORS credentials.
- MongoDB replica-set (1-node) chạy local qua docker-compose (bắt buộc cho transaction sau này).
- DigitalOcean Spaces (S3) config (env + client) — bucket dev hoặc MinIO.
- TypeScript strict mode (cả 2 repo). shadcn/ui + Tailwind: web đã có sẵn (giữ).
- Path alias `@/*`.

**Non-functional:**
- Bundle size baseline `< 200KB` JS gzipped cho route `/`.
- Type check + lint chạy < 30s.
- Hot reload < 2s.

## Architecture

**`badminton-web` (repo này — ĐÃ TỒN TẠI, chỉ thêm phần ★):**
```
fb-tournament-fe/                 # = badminton-web (Next 16 + yarn, đã có app/components/lib + Firebase)
├── app/ components/ lib/         # đã có (Firebase) — GIỮ NGUYÊN ở P01 (strangler)
├── lib/
│   ├── api/                  ★   # REST client + TanStack Query hooks (mới)
│   │   ├── client.ts         ★   # fetch wrapper, credentials:'include', base = NEXT_PUBLIC_API_URL
│   │   └── health.ts         ★   # GET /health hook (placeholder)
│   ├── socket.ts             ★   # socket.io-client + room subscribe helpers (mới)
│   ├── firebase/                 # GIỮ (strangler) — gỡ dần ở phase sau
│   └── ...                       # tournaments/courts/fees/referees/auth (Firebase) — giữ
├── .env.local.example        ★   # + NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL
├── next.config.ts                # (web ở Vercel — không cần standalone)
└── package.json                  # yarn
```

**`badminton-api` (NestJS, repo riêng — greenfield, tại `/Users/trunglam/Personal/badminton-api`):**
```
badminton-api/
├── src/
│   ├── main.ts                   # session middleware + Passport + SocketIoAdapter + CORS(credentials) + helmet
│   ├── app.module.ts             # MongooseModule.forRoot(uri replicaSet), ConfigModule, ThrottlerModule
│   ├── common/{guards,decorators,interceptors,filters}/
│   ├── domain/                   # PURE (no nest/mongoose) — placeholder
│   ├── schemas/                  # Mongoose schemas — placeholder
│   ├── modules/
│   │   ├── health/health.controller.ts   # GET /health → { ok:true, ts }
│   │   └── realtime/realtime.gateway.ts   # Socket.IO gateway bootstrap (emit placeholder)
│   └── config/                   # env schema (Mongo URI, session secret, Spaces keys, SMTP)
├── docker-compose.yml            # mongo (replica-set 1-node) + api
├── Dockerfile                    # NestJS build
├── nginx/                        # reverse proxy config (note prod: / → web, /api → api, /socket.io → ws)
├── .env.example                  # MONGO_URI, SESSION_SECRET, SPACES_*, SMTP_*
├── tsconfig.json (strict)
└── package.json
```

## Related Code Files

- Create: toàn bộ `badminton-api/*` (greenfield); web: `lib/api/{client,health}.ts`, `lib/socket.ts`, `.env.local.example` bổ sung.
- Modify (web): `.env.local.example`, có thể `package.json` (thêm `socket.io-client`).
- Delete: none ở P01 (strangler — Firebase giữ nguyên).

## Implementation Steps

1. **Web (`badminton-web`) — ĐÃ scaffold (Next 16 + yarn + Tailwind + shadcn).** KHÔNG init lại. Thêm `lib/api/client.ts` (fetch wrapper, `credentials:'include'`, base `NEXT_PUBLIC_API_URL`) + `lib/api/health.ts` (TanStack Query hook gọi `GET /health`) + `lib/socket.ts` (socket.io-client connect `NEXT_PUBLIC_SOCKET_URL`). `yarn add socket.io-client`.
2. **Web env:** bổ sung `.env.local.example` + `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`. Giữ toàn bộ Firebase env (strangler).
3. **TypeScript strict config (api):** `tsconfig.json` set `"strict": true, "noUncheckedIndexedAccess": true`. (Web đã strict — không đụng.)
4. **Init NestJS (`badminton-api`):**
   - `cd /Users/trunglam/Personal && pnpm dlx @nestjs/cli new badminton-api` (repo riêng, git init). Node 20, TS strict.
   - Cài: `@nestjs/mongoose mongoose`, `express-session connect-mongo`, `@nestjs/passport passport passport-local bcrypt`, `@nestjs/platform-socket.io socket.io`, `helmet`, `@nestjs/throttler`, `class-validator class-transformer`, `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`, `nodemailer`.
5. **MongoDB replica-set qua docker-compose:**
   - `docker-compose.yml`: service `mongo` chạy với `--replSet rs0` (1-node RS), init script `rs.initiate()`; service `api` build từ Dockerfile, depends_on mongo.
   - **Lưu ý:** replica set bắt buộc để dùng multi-doc `session.withTransaction` ở các phase sau (bốc thăm, cascade, end-match).
6. **NestJS bootstrap `main.ts`:**
   - express-session + `connect-mongo` store (collection `sessions`, TTL); cookie `connect.sid` HTTP-only, Secure, SameSite.
   - Passport init (strategy thêm ở P2).
   - `SocketIoAdapter` (Socket.IO) + helmet + CORS `{ credentials: true, origin: web domain }`.
   - ConfigModule load env schema (Mongo URI, SESSION_SECRET, Spaces keys, SMTP).
7. **Health endpoint + Socket.IO gateway placeholder:** `GET /health` trả `{ ok: true, ts: now }`. `realtime.gateway.ts` bootstrap Socket.IO (namespace `/`, room helpers, emit placeholder).
8. **Spaces (S3) config:** env `SPACES_ENDPOINT/REGION/KEY/SECRET/BUCKET`; khởi tạo `@aws-sdk/client-s3` client (presign service thêm ở P3). Dev có thể dùng MinIO container.
9. **Guard/decorator skeleton (`common/`):** stub `AuthenticatedGuard`, `RolesGuard`, `TournamentRoleGuard`, `@Public()`, `@CurrentUser()` + serialize interceptor (class-serializer, exclude PII) — implement đầy đủ ở P2+. Thay thế hoàn toàn khái niệm `firestore.rules`.
10. **Nginx note (prod, api repo):** thêm `nginx/` config mẫu chỉ front api: `/api` → api, `/socket.io` → api với header `Upgrade`/`Connection` cho websocket. Web ở Vercel (không qua Nginx). Chỉ note ở P1, deploy thật P5+.
11. **CI baseline:** GitHub Action `.github/workflows/ci.yml` — web: `yarn install --immutable`, `yarn build`/lint. api: `pnpm install`, `pnpm typecheck/lint/build` + `docker build`.
12. **Vercel link (web):** đã link/hoặc `vercel link`. Setup env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.
13. **Smoke test:**
    - `yarn dev` (web) → `localhost:3000` chạy (app hiện tại vẫn hoạt động — Firebase còn nguyên).
    - `docker-compose up` (api) → api up (port 3001), mongo RS healthy.
    - Web gọi `GET /health` qua `lib/api/client.ts` → return `{ok:true}` (cross-origin cookie test).
    - Socket.IO client (`lib/socket.ts`) connect được tới gateway.
14. **README:** web — bổ sung mục "API integration" (env + lib/api); api — commands (docker-compose up / pnpm typecheck/test).
15. **.gitignore:** `.env.local`, `.env`, `node_modules/`, `.next/`, `dist/`, mongo data volume.

## Success Criteria

- [ ] api: `pnpm typecheck` + `pnpm lint` + `pnpm build` pass (TS strict)
- [ ] web: `yarn build` vẫn pass (Firebase còn nguyên, không vỡ)
- [ ] `docker-compose up` chạy được mongo replica-set 1-node + api
- [ ] Web gọi `GET /health` qua REST (lib/api) → trả `{ok:true}`
- [ ] Socket.IO client (lib/socket.ts) connect được gateway
- [ ] Web vẫn chạy bình thường (app Firebase hiện tại không bị ảnh hưởng)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Mongo replica-set 1-node init flaky trong docker-compose | Init script `rs.initiate()` chờ healthcheck; pin Mongo 6+; document lệnh reset volume |
| CORS + cookie cross-origin (web Vercel ↔ api local) không gửi credentials | `credentials:'include'` ở fetch + CORS `credentials:true` + cookie `SameSite=None;Secure` khi khác domain (Lax nếu cùng domain qua Nginx) |
| Tailwind v4 breaking changes vs shadcn | Pin Tailwind v3.4 nếu shadcn chưa support v4 |
| Socket.IO không upgrade qua Nginx prod | Config `proxy_set_header Upgrade/Connection` (note sẵn ở `nginx/`) |
| Spaces dev không có bucket | Fallback MinIO container trong docker-compose |

## Security Considerations

- `.env.local` / `.env` KHÔNG commit, có template `.env.local.example` / `.env.example`.
- `SESSION_SECRET`, Spaces keys, SMTP creds chỉ trên Vercel/CI env vars, không commit.
- Session cookie HTTP-only + Secure + SameSite.
- Guards mặc định chặn mọi mutation chưa auth — thay thế `firestore.rules` deny-by-default; mở dần ở phase sau.

## Next Steps

→ Phase 2 (Auth and User): implement Passport local strategy, register endpoint (bcrypt), nationalId unique index, guards + supertest authz tests.
