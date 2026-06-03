---
phase: 10
title: "Demo and Polish"
status: pending
priority: P1
effort: "3-5d"
dependencies: [9]
---

# Phase 10: Demo and Polish

## Overview

Chạy thử 1 giải nội bộ thật end-to-end để verify toàn bộ 18 bước acceptance criteria của PDR. Fix bug phát hiện. Visual polish (empty state, error message, loading state). Performance pass. Deploy production (web → **Vercel**; api → **Docker + Nginx** + MongoDB replica set + DigitalOcean Spaces). **Gate quan trọng nhất:** không pass phase này = không declare MVP done.

## Requirements

**Functional:**
- Chạy 1 giải demo nội bộ với data thật:
  - 3 category: `MS` (đơn nam, 8 đội), `MX` (đôi nam-nữ, 4 cặp), `OPEN` (đôi unrestricted, 6 cặp).
  - Full workflow: setup → đăng ký → duyệt → seed → bốc thăm → vận hành → score → end.
- Verify đầy đủ 18 bước acceptance criteria PDR §10.
- Bug fix priorities: P1 (blocker), P2 (UX rough), P3 (cosmetic).
- Visual polish: empty states, error messages tiếng Việt friendly, loading skeletons, toast notifications.
- Performance pass: Lighthouse audit, optimize chỗ nào < threshold.
- Deploy production: web → Vercel (prod); api → Docker image + Nginx reverse proxy + MongoDB replica set + DigitalOcean Spaces.

**Non-functional:**
- 0 P1 bug at gate close.
- ≤ 5 P2 bug at gate close (tracked, không block).
- Lighthouse: Performance ≥ 80, A11y ≥ 90, SEO ≥ 90.
- All guard/authz e2e tests pass.
- All e2e module tests pass.

## Architecture

**Files (phần lớn là edit, ít file mới). Repo: `badminton-web` (này) + `badminton-api` (riêng).**
```
docs/
├── deployment-guide.md                       # tạo mới
└── project-changelog.md                      # tạo + log P0-P3

(badminton-api) scripts/ + ops/
├── demo-data-seed.ts                         # seed data demo cho E2E
├── reset-db.ts                               # drop + reseed Mongo (dev)
├── docker-compose.prod.yml                   # api + mongo RS + nginx (web KHÔNG dockerize — Vercel)
├── Dockerfile                                # badminton-api (NestJS + Socket.IO)
└── nginx.conf                                # /api, /socket.io (websocket upgrade) — chỉ front api

tests/e2e/                                     # Playwright (web Vercel preview + api qua docker-compose)
├── acceptance-criteria-full-flow.spec.ts     # full 18-step
├── operations-console-stress.spec.ts         # rapid assign matches
└── cascade-revert-edge-cases.spec.ts

components/shared/
├── empty-state.tsx                           # generic empty state
├── error-boundary.tsx
├── loading-skeleton.tsx
└── friendly-error.tsx                        # translate API error codes → VN messages
```

## Related Code Files

- Modify: nhiều — tuỳ bug fix phát hiện
- Create: docs + scripts + Docker/Nginx config + E2E tests
- Delete: dead code phát hiện trong polish pass

## Implementation Steps

### E2E acceptance test (Playwright)

1. **Setup Playwright** — chạy web (`next dev`/Vercel preview) trỏ api lên docker-compose (api + mongo RS) cho E2E environment.
2. **`acceptance-criteria-full-flow.spec.ts`**: viết test cover 18 bước:
   - User A signup (nationalId valid — UI label "CCCD").
   - User B signup trùng nationalId → reject (`NATIONAL_ID_ALREADY_REGISTERED`).
   - Admin grant organizer_capable cho A.
   - A tạo tournament + 3 sân + 3 category (MS, MX, OPEN).
   - 8 user khác signup, đăng ký MS.
   - 4 cặp signup + đăng ký MX (1 cặp sai gender → API reject).
   - 5 cặp đăng ký OPEN (mixed combinations, không validate).
   - A duyệt 7/8 MS, mark paid 5 + reject 1 → slot mở, user mới fill.
   - A thử close khi còn pending → reject. Duyệt nốt → close.
   - User B (khách lạ) check public roster sau closed.
   - A bulk register 5 dòng test (1 sai → 4 success).
   - A set seed cho 3 đội trong MS.
   - A bốc thăm MS → bracket sinh đúng (verify slot positions).
   - A set schedule config.
   - A vào ops console: gán C vào Sân 1, D vào Sân 2.
   - A gán match MS-R1-0 vào Sân 1 → `match.refereeUserId` = C.
   - C nhập điểm best-of-3, endMatch → winner advance.
   - User D withdraw mid-tournament → cascade walkover.
   - A edit điểm R1-1 đổi winner → confirm cascade → R2 reset.
   - Public realtime check (Socket.IO push).
3. **Stress test ops console**: 50 matches, gán 20 trong 1 phút → no race condition, all assignments coherent.

### Bug triage process

4. **Run E2E test → log all failures.**
5. **Manual exploratory testing 2 ngày**: 3 người (1 organizer, 1 referee, 1 khán giả) thử hết feature → log bugs.
6. **Bug list**:
   - P1 = blocker (test không pass, feature broken). FIX TRƯỚC.
   - P2 = UX rough (chậm, confusing, error message tiếng Anh). FIX nếu thời gian cho phép.
   - P3 = cosmetic (margin, color, copy). Defer.
7. **Fix loop:** test → fix → re-run E2E → repeat.

### Visual polish

8. **Empty states**: mọi list view (tournament list, category list, registration list, match list, schedule) có empty state với CTA rõ ràng.
9. **Error messages tiếng Việt**:
   - Map API error codes → friendly messages.
   - Form validation errors hiển thị inline.
   - Toast notifications dùng `useToast` shadcn.
10. **Loading skeletons**: cho RSC fallback + client-side loading.
11. **404 page**: tiếng Việt, link về homepage.
12. **Tournament card image fallback**: nếu không banner → placeholder image.

### Performance pass

13. **Lighthouse audit** trên 5 page chính: homepage, tournament page, bracket page, ops console, schedule.
14. **Optimize**:
    - Image: convert PNG → WebP qua Spaces upload pipeline (P5+, MVP chỉ next/image).
    - Bundle: dynamic import cho ops console + bracket viewer + Socket.IO client.
    - Mongo: tạo indexes qua Mongoose `ensureIndexes()` / migration on boot (xem §4 system-architecture — unique + compound indexes).
15. **Cost projection (self-host)**:
    - Tính chi phí infra cho 1 giải 20 đội: VPS (web + api containers) + MongoDB replica set (cùng VPS hoặc managed) + DigitalOcean Spaces (storage + bandwidth ảnh) + outbound bandwidth.
    - So với Firestore free tier cũ: giờ là chi phí server cố định (~$X/tháng VPS + Spaces $5/250GB) — không còn read/write quota, scale theo CPU/RAM/bandwidth.
    - Document trong `deployment-guide.md`.

### Security final pass

16. **Run all guard/authz e2e tests** (~30 tests từ các phase trước — supertest + mongodb-memory-server).
17. **Penetration check manual**:
    - Try gọi mutation endpoint khi chưa login → `AuthenticatedGuard` reject (401).
    - Try đọc `GET /admin/users/:id` (PII) khi không phải owner/admin → reject (serializer + guard).
    - Try đọc roster category `open` (chưa closed) qua `GET /public/...` → roster ẩn.
    - Try fetch public bracket → response KHÔNG chứa `nationalId`/`phone`/`email`.
    - Try organizer-only mutation với role referee → `TournamentRoleGuard` reject.
18. **Rate limit tests**: spam `POST /categories/:cid/registrations` 20 lần/phút → bị throttle (`ThrottlerModule`) sau quota.

### Deployment

19. **Production setup**:
    - **Web** (`badminton-web`): deploy **Vercel prod** — set env `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_SOCKET_URL` trỏ domain api; custom domain + SSL (Vercel auto).
    - **API** (`badminton-api`): build + push 1 Docker image (NestJS + Socket.IO). `docker-compose.prod.yml`: api + MongoDB (replica set, init RS) + Nginx (chỉ front api).
    - Nginx: route `/api` → api, `/socket.io` → api (set `Upgrade`/`Connection` headers cho websocket). KHÔNG front web (web ở Vercel).
    - Cookie cross-origin: `connect.sid` `SameSite=None;Secure` + CORS `credentials:true` origin = web Vercel domain (cả 2 phía HTTPS).
    - MongoDB replica set khởi tạo (`rs.initiate()`) — bắt buộc cho transaction (bốc thăm, cascade, end-match).
    - Mongo indexes: chạy `ensureIndexes()` lúc API boot (unique `users.email`, `users.identity.nationalId`, `tournaments.slug`, compound `tournamentRoles`, `categories`, etc.).
    - DigitalOcean Spaces: tạo bucket + cấu hình CORS (cho presigned PUT từ browser) + bucket policy public-read cho prefix ảnh.
    - Secrets qua env file / secret manager (KHÔNG commit): `MONGO_URI`, `SESSION_SECRET`, Spaces keys (`SPACES_KEY`/`SPACES_SECRET`/`SPACES_BUCKET`/`SPACES_REGION`), SMTP (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`) cho forgot-password.
20. **DNS + SSL**: web domain trỏ Vercel (SSL auto); api domain trỏ Nginx, TLS qua Let's Encrypt (certbot) — HTTPS bắt buộc cho cookie cross-origin.
21. **Smoke test prod**: 1 user signup + 1 tournament tạo + 1 match nhập điểm + 1 client xem realtime qua Socket.IO.

### Documentation

22. **`docs/deployment-guide.md`**: bước build/push Docker images, docker-compose prod, Nginx config, Mongo RS init + indexes, Spaces bucket/CORS setup, env vars/secrets, monitoring URLs.
23. **`docs/project-changelog.md`**: log P0-P3 implementations + decisions.
24. **README**: update với production URL + screenshot.
25. **Update `docs/codebase-summary.md`**: tổng quan codebase sau MVP (web + api).

### Demo session

26. **Chạy demo nội bộ** với 3-5 người trong team:
    - 1 người làm organizer, setup giải.
    - 2-3 người đăng ký + đôi.
    - 1 người làm trọng tài.
    - 1 người làm khán giả xem public.
27. **Ghi nhận feedback**: list ý kiến → tách thành P4 backlog.

## Success Criteria

- [ ] E2E test `acceptance-criteria-full-flow.spec.ts` pass 100%.
- [ ] 18 bước PDR §10 verified.
- [ ] 0 P1 bug.
- [ ] Lighthouse Performance ≥ 80, A11y ≥ 90, SEO ≥ 90 trên 5 page chính.
- [ ] All guard/authz e2e tests pass.
- [ ] All e2e module tests pass.
- [ ] Production deploy thành công (web Vercel + api Docker/Nginx + Mongo RS + Spaces), smoke test pass.
- [ ] `docs/deployment-guide.md` + `docs/project-changelog.md` đầy đủ.
- [ ] Demo session với team, feedback ghi nhận.
- [ ] Cost projection (self-host) document.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Phát hiện P1 bug mất nhiều thời gian fix | Buffer 2-3 ngày extra; P3 defer aggressive |
| Mongo RS prod khác mongodb-memory-server behavior | Smoke test prod (real RS) trước demo |
| Production infra cost vượt dự kiến | Cost projection trước deploy; monitor VPS + Spaces bandwidth |
| Demo session crash trước khán giả | Run rehearsal trước session 1 ngày |
| Docker build time chậm | Cache layer (pnpm + next build cache + multi-stage) |
| Socket.IO single instance giới hạn concurrent connection | Acceptable cho MVP (1 giải/lúc); multi-instance + Redis adapter defer P5+ |

## Security Considerations

- Production guards + serializer enforce nghiêm (PII `@Exclude`, public read no-leak).
- `SESSION_SECRET` + Spaces keys + SMTP creds: rotate trước go-live, lưu secret manager.
- DigitalOcean Spaces: public-read CHỈ cho prefix ảnh (banner/avatar/team photo); deny list bucket; presigned PUT scoped per object.
- Nginx: rate limit cơ bản + security headers (CSP cho phép Spaces origin); ẩn server version.
- MongoDB: bind nội bộ docker network, không expose port public; auth enabled.

## Next Steps (post-MVP)

→ **Plan P4-P5** (separate plan):
- Round Robin + Group + Playoff formats
- Doubles UI nâng cao (drag-drop seed)
- Trọng tài invite qua link/email
- Schedule conflict detection nâng cao
- Re-arrange bracket cross-round
- Socket.IO multi-instance scaling (Redis adapter)

→ **P6+**:
- ELO ranking
- Payment gateway integration (VNPay/MoMo)
- Mobile app native
- Multi-tournament cross-stats
