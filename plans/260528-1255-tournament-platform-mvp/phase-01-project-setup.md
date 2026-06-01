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

Khởi tạo monorepo Next.js 15 + Firebase project. Setup CI/CD baseline, tooling, env config. Output: 1 commit "Hello world" deploy được lên Vercel + Firebase emulator chạy local.

## Requirements

**Functional:**
- Next.js 15 App Router dự án dựng được, deploy Vercel preview.
- Firebase project (dev + prod) tạo xong: Auth, Firestore, Storage, Functions Gen 2 enabled.
- Firebase emulator suite chạy local (auth, firestore, functions, storage).
- shadcn/ui + Tailwind cấu hình + dark mode toggle baseline.
- TypeScript strict mode.
- Path alias `@/*` cho src.

**Non-functional:**
- Bundle size baseline `< 200KB` JS gzipped cho route `/`.
- Type check + lint chạy < 30s.
- Hot reload < 2s.

## Architecture

```
fb-tournament-fe/
├── app/                          # Next.js App Router
│   ├── (public)/page.tsx         # placeholder homepage
│   └── layout.tsx
├── components/ui/                # shadcn primitives
├── lib/
│   ├── firebase/
│   │   ├── client.ts             # initializeApp(client config)
│   │   ├── admin.ts              # Admin SDK init (for SSR)
│   │   └── emulator.ts           # connect emulators in dev
│   ├── validators/               # Zod schemas (shared client+CF)
│   └── utils.ts
├── functions/
│   ├── src/
│   │   ├── index.ts              # CF exports
│   │   └── handlers/health.ts    # placeholder
│   ├── package.json              # nested for Functions Gen 2 v2
│   └── tsconfig.json
├── public/
├── firebase.json                 # emulator config + hosting rules
├── firestore.rules               # security rules (start permissive in dev)
├── storage.rules
├── .firebaserc                   # project alias mapping
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── components.json               # shadcn config
├── tsconfig.json (strict)
└── package.json
```

## Related Code Files

- Create: tất cả file ở Architecture tree trên
- Modify: none (greenfield)
- Delete: none

## Implementation Steps

1. **Init Next.js 15:** `pnpm create next-app@latest fb-tournament-fe --typescript --tailwind --app --src-dir false --turbo` → strict TS, Tailwind, App Router. Use **pnpm** (workspace-ready cho monorepo nếu tách functions).
2. **Tailwind v4 + shadcn/ui setup:** `pnpm dlx shadcn@latest init` chọn Slate, CSS vars, dark mode class. Cài 5 component core: `button, input, label, dialog, toast`.
3. **TypeScript strict config:** `tsconfig.json` set `"strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true`.
4. **Firebase project:**
   - Tạo 2 project Firebase Console: `tournament-fe-dev`, `tournament-fe-prod`.
   - Bật Auth (Google + Email/Password), Firestore (mode native, location asia-southeast1), Storage, Functions.
   - `.firebaserc` map alias `dev` / `prod`.
5. **Firebase SDK install:**
   - Client: `pnpm add firebase`
   - Admin: `pnpm add firebase-admin` (cho RSC)
   - Functions: `cd functions && pnpm init && pnpm add firebase-functions@^6 firebase-admin`
6. **Init lib/firebase/{client,admin,emulator}.ts:**
   - Client: dùng env `NEXT_PUBLIC_FIREBASE_*` từ `.env.local`.
   - Admin: dùng service account JSON (lưu trong `.env.local`, không commit).
   - Emulator: `connectAuthEmulator`, `connectFirestoreEmulator`, `connectFunctionsEmulator` khi `process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'`.
7. **Functions Gen 2 boilerplate:** `functions/src/index.ts` export 1 `health` callable trả `{ ok: true, ts: now }`. TSConfig target ES2022.
8. **firebase.json emulator config:**
   ```json
   { "emulators": { "auth": {"port":9099}, "firestore": {"port":8080}, "functions": {"port":5001}, "storage": {"port":9199}, "ui": {"enabled": true, "port": 4000} } }
   ```
9. **firestore.rules + storage.rules**: deny by default. Allow nothing.
10. **CI baseline:** GitHub Action `.github/workflows/ci.yml` chạy: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `cd functions && pnpm build`.
11. **Vercel link:** `vercel link` → connect repo. Setup env vars `NEXT_PUBLIC_FIREBASE_*` từ Firebase config.
12. **Smoke test:**
    - `pnpm dev` → `localhost:3000` shows "Hello".
    - `pnpm emulator` → emulators up, UI accessible `localhost:4000`.
    - Call `health` callable từ client → return `{ok:true}`.
    - Push branch → Vercel preview deploy success.
13. **README:** ghi commands chính (dev, emulator, deploy, test).
14. **.gitignore**: `.env.local`, `.firebase/`, `node_modules/`, `.next/`, `firebase-debug.log`.

## Success Criteria

- [ ] `pnpm typecheck` pass (TS strict)
- [ ] `pnpm lint` pass
- [ ] `pnpm build` pass cho cả app và functions
- [ ] `pnpm emulator` chạy được 5 emulators
- [ ] Client gọi `health` CF trên emulator → trả về `{ok:true}`
- [ ] Vercel preview deploy thành công
- [ ] Bundle size baseline ghi xuống trong README để track regression

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Firebase Functions Gen 2 chưa stable trên Node 22 | Pin Node version 20 cho functions runtime trong `functions/package.json` (engines) |
| Vercel + Firebase Admin SDK cold start chậm | Lazy init Admin trong route handler. Đo sau, optimize nếu cần. |
| Tailwind v4 breaking changes vs shadcn | Pin Tailwind v3.4 nếu shadcn chưa support v4 |
| pnpm workspace conflict với Functions deploy | Functions có package.json riêng, deploy với `firebase deploy --only functions` từ root |

## Security Considerations

- `.env.local` KHÔNG commit, có template `.env.local.example`.
- Service account JSON cho Admin SDK chỉ trên Vercel/CI env vars, không commit.
- `firestore.rules` mặc định deny everything — phase sau sẽ mở dần.

## Next Steps

→ Phase 2 (Auth and User): mở rules cho user signup, build flow CCCD uniqueness.
