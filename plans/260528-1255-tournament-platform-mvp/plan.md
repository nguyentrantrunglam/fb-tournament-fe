---
title: "Tournament Platform MVP — P1 to P3 (Auth, Registration, Bracket, Operations, Public)"
description: "Greenfield implementation of badminton tournament platform: Next.js 15 (badminton-web) + NestJS (badminton-api) + MongoDB + Socket.IO + DigitalOcean Spaces. Scope MVP P1-P3 — auth, tournament setup, registration, bracket, match operation, public realtime view."
status: pending
priority: P1
branch: ""
tags: [greenfield, mvp, nextjs, nestjs, mongodb, socketio, tournament]
blockedBy: []
blocks: []
created: "2026-05-28T06:03:44.000Z"
createdBy: "ck:plan"
source: skill
---

# Tournament Platform MVP — P1 to P3

## Overview

Greenfield implementation của platform công khai quản lý giải đấu cầu lông phong trào. Stack (pivot v0.2): **Next.js 15 (App Router + RSC) = `badminton-web` (repo này) + NestJS = `badminton-api` (repo riêng) + MongoDB (replica set) + Socket.IO + DigitalOcean Spaces (S3)**. Deploy: web → **Vercel** (dev+prod); api → **Docker + Nginx**. Auth: email/password qua API session (không Google OAuth). Scope plan này là **MVP P1-P3** theo PDR roadmap — đủ để 1 BTC chạy 1 giải hoàn chỉnh end-to-end. P4-P5 (doubles UI polish, round-robin, group+playoff, trọng tài invite flow) sẽ có plan riêng sau khi MVP demo thành công.

> **Pivot note:** plan này đã rewrite từ stack Firebase (v0.1) sang NestJS+Mongo+Socket.IO (v0.2). Domain/business rule giữ nguyên. Map chi tiết: [architecture-pivot mapping report](../reports/architecture-pivot-260603-1217-firebase-to-nestjs-mongo-mapping-report.md).

**Artifact spec đã lock (tiền đề bắt buộc):**
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md) — D1-D40 decisions, scope, acceptance criteria 18-step
- [docs/system-architecture.md](../../docs/system-architecture.md) — ERD, MongoDB schema, NestJS structure, guards, Socket.IO, 10 flows
- [docs/bracket-algorithm-spec.md](../../docs/bracket-algorithm-spec.md) — single-elim + crossover seeding, mode auto-detect (pure domain, không đổi khi pivot)

**Mục tiêu cuối plan:** Chạy thử 1 giải nội bộ thật (8 VĐV đơn nam + 4 cặp mixed + 5 cặp open) từ đầu đến cuối qua app, có khán giả xem realtime.

## Strategic Sequencing Rationale

10 phase sắp theo data-flow dependency, không phải theo subsystem:
1. **P01-P02**: nền tảng (project + auth) — không có bước này không gì chạy được.
2. **P03-P04**: setup phase của BTC (tournament/category + registration + payment).
3. **P05-P07**: core bracket logic (gen → operate → edit) — phức tạp nhất, isolate vào group riêng.
4. **P08**: operations workflow (gán sân/trọng tài + schedule).
5. **P09**: surface public (RSC + realtime listener).
6. **P10**: demo thật + bug fix + polish.

**Gate sau P09:** chạy 1 giải nội bộ thật. Đừng tối ưu UI/feature phụ trước khi đi qua gate này.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Project Setup](./phase-01-project-setup.md) | Pending |
| 2 | [Auth and User](./phase-02-auth-and-user.md) | Pending |
| 3 | [Tournament and Category](./phase-03-tournament-and-category.md) | Pending |
| 4 | [Registration and Payment](./phase-04-registration-and-payment.md) | Pending |
| 5 | [Bracket Generation](./phase-05-bracket-generation.md) | Pending |
| 6 | [Match Operation](./phase-06-match-operation.md) | Pending |
| 7 | [Edit Score and Cascade Revert](./phase-07-edit-score-and-cascade-revert.md) | Pending |
| 8 | [Operations Console and Schedule](./phase-08-operations-console-and-schedule.md) | Pending |
| 9 | [Public Views and Realtime](./phase-09-public-views-and-realtime.md) | Pending |
| 10 | [Demo and Polish](./phase-10-demo-and-polish.md) | Pending |

## Cross-Phase Architecture Anchors

- **Logic portable (domain/ thuần)**: P05 và P07 cài đặt thuật toán bracket trong `src/domain/` (badminton-api), KHÔNG import nestjs/mongoose. Mọi phase khác chạm bracket logic phải qua service/repository, không gọi domain trực tiếp từ controller.
- **Service ↔ endpoint naming**: controller route theo REST (`POST /matches/:mid/end`), service method `endMatch()`. Map đầy đủ ở mapping report §2. Mọi phase tuân thủ.
- **Validation as pure functions**: gender, national-id, category-config — `src/domain/validation/*.ts`. Share shape giữa client (Zod) + server (DTO/class-validator).
- **PII isolation**: `user.identity = { nationalId, phone }` + `@Exclude()` serializer. Mọi phase chạm nationalId/email/phone phải tôn trọng (không leak ra response/log).
- **Audit log**: mọi mutation quan trọng → insert `auditLogs` doc `{ tournamentId?, type, actorUserId, payload, at }`, immutable.
- **Realtime**: mọi mutation ảnh hưởng view → service emit Socket.IO sau khi commit transaction (`match:updated`, `bracket:updated`, `registration:updated`, `court:updated`).
- **Atomicity**: mutation đa-document (bốc thăm, end-match, cascade, withdrawal) chạy trong **Mongo session transaction** (replica set bắt buộc).

## Out of Plan (định kỳ revisit)

- **P4 features**: Round Robin format, Group + Playoff, Doubles UI nâng cao (drag-drop seed)
- **P5 features**: Trọng tài invite qua link/email, schedule conflict detection nâng cao
- **P6+**: ELO ranking, payment gateway integration, mobile app native, multi-tournament cross-stats

## Risk Register (high-level)

| Risk | Impact | Mitigation Phase |
|---|---|---|
| Mongo transaction cần replica set; misconfig → atomic fail | High | P01 — docker-compose RS 1-node dev; RS thật prod; healthcheck |
| Cascade revert phá vỡ consistency | High | P07 — Mongo transaction + UI confirm dialog + preview-cascade endpoint |
| Race condition slot count khi đăng ký đồng thời | Medium | P04 — running counter trong Mongo transaction; unique guard |
| Authz guard sai sót leak data (thay rules) | High | P02 + P04 + P09 — guard + serializer + e2e auth test (supertest) |
| Trọng tài đổi giữa match đang chạy | Low | P08 — snapshot refereeUserId khi assign court, không re-sync |
| Session/cookie cross-origin web↔api sai | High | P01+P02 — cùng domain qua Nginx hoặc CORS credentials + SameSite |
| Public page tải chậm khi giải đông | Medium | P09 — RSC + HTTP cache (Nginx/Vercel), denormalize fields cần thiết |

## Dependencies

Plan này KHÔNG block / blockedBy plan nào khác (đây là plan đầu tiên của repo).

## Acceptance Gate (toàn plan)

Tham chiếu PDR §10 "Acceptance Criteria của MVP" — chạy được toàn bộ 18 bước (từ user signup CCCD đến public xem score realtime + organizer cascade revert) trên môi trường staging.

**Phase 10 sẽ verify từng bước.**

## Validation Log

### Session 1 — 2026-05-28

**Tier:** Full (10 phases) → applied phase-internal consistency check (greenfield, no codebase to fact-check).

**Verification Results:**
- Docs references checked: 3 (PDR, system-arch, bracket-spec) — all exist ✓
- Field naming consistency (`refereeUid`): 1 stale reference `assignedRefereeUid` fixed in `docs/system-architecture.md` flow 8.4 ✓
- Phase dependency chain: linear P01→P10, logical ✓
- No `[UNVERIFIED]` tags ✓

**Interview — 8 critical questions, all answered "Recommended" defaults:**

| # | Topic | Decision |
|---|---|---|
| Q1 | Bracket max size | **Cap 128** for MVP; chunked transaction at P4+ if needed |
| Q2 | Effort timeline | **6-10 weeks** for 1 dev fulltime accepted |
| Q3 | `organizer_capable` global role | **Accepted** — admin grants user to create tournament |
| Q4 | Cascade revert with in_progress match | **Reset + strong UI warning** (per spec §8.5) |
| Q5 | Bulk register cap | **50 rows/batch** sufficient for MVP |
| Q6 | Schedule auto-recalc on court change | **No auto** — BTC calls setScheduleConfig manually |
| Q7 | Cloud Functions cold start | **Accepted** — loading skeleton mitigates UX |
| Q8 | Image upload | **Client compress ≤ 1MB** (canvas resize) |

**Decisions confirmed:** All 8 align with plan assumptions. No phase content changes required.

### Whole-Plan Consistency Sweep

Re-checked plan.md + 10 phase files post-validation:
- ✓ All references to `refereeUid` consistent (1 stale fixed pre-interview).
- ✓ No `assignedRefereeUid` remaining anywhere.
- ✓ Cascade revert mention in P05 + P07 align with spec §8.5.
- ✓ Bracket cap 128 stated explicitly in P05 + risk register.
- ✓ `organizer_capable` introduced P03, no conflict elsewhere.
- ✓ Compression ≤ 1MB referenced P04 (team photo) + P03 (banner) — consistent.

**Unresolved contradictions:** None.

**Recommendation:** ✅ Plan eligible for implementation. Proceed with `/ck:cook`.

### Session 2 — 2026-06-03 (Architecture pivot)

**Trigger:** Feedback reviewer — pivot toàn bộ stack Firebase → NestJS + MongoDB + Socket.IO + DigitalOcean Spaces + Docker/Nginx. Repo tách: `badminton-web` (repo này) + `badminton-api` (NestJS riêng).

**Phạm vi rewrite:** plan.md + 10 phase files + `docs/system-architecture.md` + `docs/project-overview-pdr.md`. `docs/bracket-algorithm-spec.md` KHÔNG đụng (pure domain).

**Nguyên tắc:** Mọi domain/business rule (D3–D40, 18-step acceptance, ERD fields, bracket spec, gender matrix, cascade) **giữ nguyên**. Chỉ đổi stack hạ tầng + rename `cccd→nationalId`, `*Uid→*UserId`, `globalRole user→athlete`.

**Map contract:** [architecture-pivot mapping report](../reports/architecture-pivot-260603-1217-firebase-to-nestjs-mongo-mapping-report.md).

**Việc MỚI do pivot (không có ở v0.1):** bcrypt + reset-token flow, connect-mongo session store + cookie cross-origin config, Mongo replica set, S3 presign service, Socket.IO gateway + session-share, Nginx reverse proxy + Dockerfile/compose.

**Resolved (user 2026-06-03):** Spaces = 1 bucket prefix `tournaments/{tid}/...`; **bỏ Google OAuth** (auth email/password qua API session); **web hosting Vercel cả dev+prod** (Docker+Nginx chỉ cho api). Còn ngỏ: Socket.IO Redis adapter (defer P5+); payment gateway (out of scope, xác nhận BTC pilot).

**Recommendation:** ✅ Plan đã pivot, eligible for implementation trên stack mới.
