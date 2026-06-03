---
phase: 5
title: "Bracket Generation"
status: pending
priority: P1
effort: "5-7d"
dependencies: [4]
---

# Phase 5: Bracket Generation

## Overview

Implement thuật toán bracket single-elimination với crossover seeding + bye allocation + mode auto-detect (seeded/random). Plus re-arrange (swap 2 slot R1). **Phase kỹ thuật quan trọng nhất — code domain layer phải pure, portable (0 import nestjs/mongoose).**

**Tham chiếu spec đầy đủ:** [docs/bracket-algorithm-spec.md](../../../docs/bracket-algorithm-spec.md). Phase này là implementation của spec đó — spec KHÔNG đổi khi pivot stack (pure domain, độc lập storage).

**Cập nhật scope (3 thể thức):** `Category.format` = `single_elim | round_robin | group_ko`. Phase này implement đầy đủ `single_elim`; sinh match `round_robin` (vòng tròn 1 lượt + xếp hạng) và `group_ko` (chia bảng → KO) theo §11 spec — domain pure, có thể tách sub-task. UI sơ đồ (React Flow, đã mock) render theo `format`.

## Requirements

**Functional:**
- `POST /categories/:cid/bracket/draw`: read approved registrations → detect mode → sinh bracket + matches (sides embedded) atomic.
- Crossover seed order chuẩn (đệ quy `buildCrossoverSeedOrder`).
- Bye allocation: top seeds (1, 2, 3...) tự thắng vào R2 khi N không phải 2^n.
- Mode auto-detect từ `Registration.seed`.
- Versioned bracket: re-draw tạo version mới, version cũ `isActive=false`.
- `POST /categories/:cid/bracket/rearrange { swap: [slotA, slotB] }`: swap 2 slot R1, tạo bracket version mới.
- Mongo session transaction cho cả bracket gen (1 transaction, kể cả N lớn).
- 12 test cases T1-T12 từ spec §15 pass.

**Non-functional:**
- N=32 bracket gen p95 < 2s (1 Mongo transaction, batch insert matches).
- N=128 bracket gen p95 < 5s.
- Domain `src/domain/bracket/` **KHÔNG import @nestjs/* hay mongoose** — pure functions only.

## Architecture

**`badminton-api` files (NestJS):**
```
src/
├── domain/
│   ├── bracket/                               # PURE — KHÔNG import @nestjs/* hay mongoose
│   │   ├── single-elim-generator.ts           # main: regs → bracket plan (matches + embedded sides + links)
│   │   ├── build-crossover-seed-order.ts      # đệ quy theo spec §7
│   │   ├── resolve-seeds.ts                   # spec §6 — seeded + unseeded random fill
│   │   ├── bye-allocator.ts                   # mark slot > N = BYE
│   │   ├── build-match-tree.ts                # gen R1..Rmax + nextMatchId links
│   │   ├── advance-bye-winners.ts             # spec §11
│   │   ├── rearrange-swap.ts                  # swap logic (spec §12)
│   │   ├── advance-winner.ts                  # dùng cả P6 — define here
│   │   └── types.ts                           # BracketPlan, MatchPlan, SidePlan — KHÔNG có Mongoose type
│   ├── shared/
│   │   ├── next-power-of-2.ts
│   │   ├── shuffle.ts                         # Fisher-Yates
│   │   └── match-id.ts                        # "{categoryId}-R{round}-{slotIndex}"
│   └── types/                                 # entity plain types
│       ├── registration.ts  bracket.ts  match.ts  side.ts
├── modules/brackets/
│   ├── brackets.controller.ts                 # POST /categories/:cid/bracket/{draw|rearrange|reset}
│   ├── brackets.service.ts                    # orchestrate domain + Mongo transaction + Socket.IO emit
│   └── bracket.repository.ts                  # @InjectModel bracket+match, read/write trong session transaction

app/(app)/giai/[slug]/quan-ly/hang-muc/[categoryId]/
├── boc-tham/page.tsx                          # UI: button "Bốc thăm" + preview seed list + result
└── boc-tham/swap/page.tsx                     # UI: swap 2 slot R1

components/bracket/
├── bracket-view.tsx                           # render bracket tree (read-only)
├── bracket-draw-preview.tsx                   # show seed assignments before commit
└── slot-swap-picker.tsx                       # pick 2 slot R1 để swap
```

## Related Code Files

- Create: tất cả ở Architecture (web + api)
- Modify:
  - `bracket.repository.ts`: write bracket + matches trong 1 Mongo session transaction
  - `realtime/` gateway: emit `bracket:updated` → room `category:{cid}`
  - `lib/api/brackets.ts` (client read + draw/rearrange/reset hooks) + `lib/socket.ts` (subscribe `category:{cid}`)
- Delete: none

## Implementation Steps

### Domain layer (pure, no nestjs/mongoose imports)

1. **`types.ts`**: define `BracketPlan = { bracket, matches[], audit }` thuần TS. Mỗi match embed `sideA`/`sideB` (plain object) + `games[]` (rỗng lúc gen). KHÔNG có Mongoose type.
2. **`build-crossover-seed-order.ts`**: đệ quy theo spec §7. Memoize (max rounds = 8 cho bracketSize 256). Unit test với expected outputs từ bảng spec.
3. **`next-power-of-2.ts`**: trivial. Unit test N=1→2, 2→2, 3→4, 6→8, 16→16, 17→32.
4. **`resolve-seeds.ts`** (spec §6):
   - Input: `registrations: Registration[]`.
   - Detect mode (`seededCount > 0 ? 'seeded' : 'random'`).
   - Validate seeded values unique + in [1, N].
   - Shuffle Fisher-Yates cho unseeded.
   - Output: `Map<number, registrationId>`.
   - Random determinism: dùng `crypto.randomUUID()`.
5. **`single-elim-generator.ts`** (orchestrator):
   - Bước 1-7 của spec §4. Output: `BracketPlan` đầy đủ (matches với sideA/sideB embedded).
   - **Pure** — chỉ nhận input, trả output. KHÔNG đọc/ghi DB.
6. **`build-match-tree.ts`**: gen tất cả matches R1..Rmax. Set `nextMatchId` linking. Set `isBye` cho R1 match có BYE phantom. `sideId` cũ → discriminator `'A'/'B'` (sideA/sideB object trong match).
7. **`advance-bye-winners.ts`** (spec §11): mỗi R1 isBye match → set `winnerSide` + fill `nextMatch` side đúng với side mới (cloned từ winner side của R1).
8. **`rearrange-swap.ts`** (spec §12):
   - Input: existing BracketPlan + swap [slotA, slotB].
   - Validate: cả 2 slot ở R1, match chứa chúng `status=pending`, R2+ chưa start.
   - Clone, swap registration ở 2 slot. Re-build R1 matches bị ảnh hưởng. Re-advance bye nếu có.
   - Output: new BracketPlan.

### Repository / persistence layer

9. **`bracket.repository.ts`** (`@InjectModel`):
   - `getActiveBracket(categoryId)`.
   - `getNextVersion(categoryId)`.
   - `writeBracketPlan(plan, session)`: insert bracket + insertMany matches (sides embedded) trong **Mongo session transaction** (cần replica set).
10. **Transaction model:**
    - **1 Mongo session transaction** cho cả draw (mark old bracket inactive + insert bracket + insertMany matches). Mongo **không có giới hạn 500 ops** như Firestore — bỏ chunked-500-writer.
    - Lo về **transaction runtime + doc size 16MB** (mỗi match 1 doc, sides+games embed gọn → an toàn). Giữ **cap N ≤ 128** thuần như giới hạn runtime/safety MVP (validate đầu vào), không phải vì limit ops.

### Service / controller layer

11. **`POST /categories/:cid/bracket/draw`** (`TournamentRoleGuard(organizer)`):
    - Read category → assert `registrationStatus === 'closed'`.
    - Read approved registrations.
    - Call `singleElimGenerator(regs, mode)` → BracketPlan.
    - Mongo session transaction: mark old active bracket `isActive=false`; insert bracket (version=max+1, isActive=true, `drawnByUserId`); insertMany matches (sideA/sideB + games[] embedded).
    - Audit log `{ type: 'BRACKET_DRAWN', mode, seedSnapshot, version }`.
    - emit Socket.IO `bracket:updated` → room `category:{cid}`.
12. **`POST /categories/:cid/bracket/rearrange`** (`TournamentRoleGuard(organizer)`):
    - Read active bracket + all matches. Validate swap eligible. Call `rearrangeSwap(...)`.
    - Mongo transaction write new version. Audit `{ type: 'BRACKET_REARRANGED', swap, oldVersion, newVersion }`. emit `bracket:updated`.
13. **`POST /categories/:cid/bracket/reset`** (`TournamentRoleGuard(organizer)|admin` override):
    - Validate: chưa match nào ở R1 status=in_progress (chỉ pending hoặc completed-from-bye).
    - Mongo transaction: set bracket `isActive=false`, all matches của bracket → delete (hoặc soft delete). Audit. emit `bracket:updated`.

### UI

14. **Trang "Bốc thăm"** (`boc-tham/page.tsx`):
    - Show seed list từ Config đội (P4) — N registrations, ai có seed.
    - Button "Bốc thăm" → confirm (cảnh báo nếu đã có bracket: "Sẽ tạo version mới, version cũ bị inactive").
    - Click → `POST .../bracket/draw` → on success show bracket view (hoặc nhận `bracket:updated` qua Socket.IO).
15. **Trang "Swap slot"** (`boc-tham/swap/page.tsx`):
    - Hiển thị R1 matches list dạng card. User click 2 slot → highlight → "Swap" → confirm → `POST .../bracket/rearrange`.
16. **Component `bracket-view.tsx`**: render bracket tree (CSS grid responsive MVP). Click match → modal detail. Subscribe `category:{cid}` qua `lib/socket.ts` → refetch/merge khi `bracket:updated`.

### Tests

17. **Unit tests domain layer (Jest)**:
    - `buildCrossoverSeedOrder(1..5)` match expected từ spec §7 table.
    - `nextPowerOf2` (5 cases).
    - `resolveSeeds`: full seeded / partial seeded / no seeded / invalid (out of range, duplicate).
    - `singleElimGenerator` cho 12 test case T1-T12 từ spec §15. Snapshot test: full BracketPlan output match expected.
    - `rearrangeSwap`: swap 2 slot pending → success; swap khi match đã in_progress → reject.
18. **e2e tests (supertest + mongodb-memory-server replica set)**:
    - End-to-end: tạo 6 reg approved → draw → verify Mongo docs (1 bracket + 7 matches với sides embedded).
    - Re-draw: draw lần 2 → version 2 active, version 1 inactive.
    - N=128: draw → time + 1 transaction OK.
19. **Guard/authz test (supertest)**: organizer draw được; non-organizer 403.

## Success Criteria

- [ ] 12 test case T1-T12 từ spec §15 pass đầy đủ.
- [ ] N=6 → 8-slot bracket, 2 bye cho seed 1+2, 2 R1 thường, 2 R2, 1 final, R2 sideA của 2 nửa = top seeds (verify worked example §13).
- [ ] Mode auto-detect: tất cả unseeded → random; có ≥1 seed → seeded.
- [ ] Re-draw lần 2 → version=2 active.
- [ ] Swap 2 slot R1 → bracket version mới, R2+ matches cập nhật đúng.
- [ ] Domain layer **0 import nestjs/mongoose** (lint rule).
- [ ] N=128 chạy < 5s (1 Mongo transaction).
- [ ] Audit log đủ thông tin để debug/replay.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bug trong crossover algorithm gây sơ đồ sai | Unit test exhaustive từ spec table; snapshot test full output |
| Race: 2 organizer cùng draw 1 category | Mongo session transaction read+write trong cùng tx; version increment atomic |
| Transaction nửa chừng fail → bracket inconsistent | 1 Mongo session transaction (atomic all-or-nothing) — không còn chunked write nửa chừng như Firestore |
| Re-arrange phá R2+ matches đang in_progress | Pre-check status; reject với rõ message |
| Bracket lớn → transaction runtime / doc size | Hard cap N ≤ 128 ở service (validate đầu vào) như giới hạn runtime/safety MVP; mỗi match 1 doc embed gọn (xa 16MB); > 128 cần đo runtime + sharding sau |
| Random shuffle predictable | crypto.randomUUID() cho seed; document |

## Security Considerations

- Only organizer draw/rearrange/reset (`TournamentRoleGuard`); reset thêm admin.
- `bracket/reset` chỉ khi chưa có match nào in_progress.
- Audit log immutable (service không update/delete `auditLogs`).
- Rate limit draw (3 calls/min/category) chống spam re-draw (ThrottlerModule).
- Transaction cần replica set (đã setup P1 docker-compose / prod RS thật).

## Next Steps

→ Phase 6 (Match Operation): match start/score/end + withdrawal cascade + cascade revert.
