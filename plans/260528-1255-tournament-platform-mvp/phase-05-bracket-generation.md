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

Implement thuật toán bracket single-elimination với crossover seeding + bye allocation + mode auto-detect (seeded/random). Plus re-arrange (swap 2 slot R1). **Phase kỹ thuật quan trọng nhất — code domain layer phải pure, portable cho migration BE sau.**

**Tham chiếu spec đầy đủ:** [docs/bracket-algorithm-spec.md](../../../docs/bracket-algorithm-spec.md). Phase này là implementation của spec đó.

## Requirements

**Functional:**
- `drawBracket(categoryId)` callable: read approved registrations → detect mode → sinh bracket + matches + sides atomic.
- Crossover seed order chuẩn (đệ quy `buildCrossoverSeedOrder`).
- Bye allocation: top seeds (1, 2, 3...) tự thắng vào R2 khi N không phải 2^n.
- Mode auto-detect từ `Registration.seed`.
- Versioned bracket: re-draw tạo version mới, version cũ `isActive=false`.
- `rearrangeBracket(categoryId, swap: [slotA, slotB])`: swap 2 slot R1, tạo bracket version mới.
- Chunked transaction cho N ≥ 128 (bracket lớn).
- 12 test cases T1-T12 từ spec § 15 pass.

**Non-functional:**
- N=32 bracket gen p95 < 2s (Firestore batch).
- N=128 bracket gen p95 < 5s (chunked).
- Domain `functions/src/domain/bracket/` **KHÔNG import firebase** — pure functions only.

## Architecture

**Files:**
```
functions/src/
├── domain/
│   ├── bracket/
│   │   ├── single-elim-generator.ts         # main: regs → bracket plan (matches + sides + links)
│   │   ├── build-crossover-seed-order.ts    # đệ quy theo spec §7
│   │   ├── resolve-seeds.ts                 # spec §6 — seeded + unseeded random fill
│   │   ├── bye-allocator.ts                 # mark slot > N = BYE
│   │   ├── build-match-tree.ts              # gen R1..Rmax + nextMatchId links
│   │   ├── advance-bye-winners.ts           # spec §11
│   │   ├── rearrange-swap.ts                # swap logic
│   │   ├── advance-winner.ts                # used in P6 too — define here
│   │   └── types.ts                         # BracketPlan, MatchPlan, SidePlan
│   ├── shared/
│   │   ├── next-power-of-2.ts
│   │   ├── shuffle.ts                       # Fisher-Yates
│   │   └── match-id.ts                      # "{categoryId}-R{round}-{slotIndex}"
│   └── types/                               # entity types
│       ├── registration.ts
│       ├── bracket.ts
│       ├── match.ts
│       └── side.ts
├── adapters/firestore/
│   ├── bracket-repo.ts                      # read/write bracket + matches + sides
│   └── chunked-writer.ts                    # chia batch > 500 ops
├── handlers/bracket/
│   ├── draw-bracket.ts                      # callable
│   ├── rearrange-bracket.ts                 # callable
│   └── reset-bracket.ts                     # admin override: huỷ bracket trước khi giải bắt đầu

app/(app)/giai/[slug]/quan-ly/hang-muc/[categoryId]/
├── boc-tham/page.tsx                        # UI: button "Bốc thăm" + preview seed list + result
└── boc-tham/swap/page.tsx                   # UI: swap 2 slot R1

components/bracket/
├── bracket-view.tsx                         # render bracket tree (read-only)
├── bracket-draw-preview.tsx                 # show seed assignments before commit
└── slot-swap-picker.tsx                     # pick 2 slot R1 để swap
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `firestore.rules`: thêm rule cho `brackets/*`, `matches/*`, `sides/*` (read theo public/private, write CF only)
  - `lib/queries/use-bracket.ts` (client read)
- Delete: none

## Implementation Steps

### Domain layer (pure, no firebase imports)

1. **`types.ts`**: define `BracketPlan = { bracket, matches[], sides[], audit }` thuần TS, không có FieldValue.
2. **`build-crossover-seed-order.ts`**: đệ quy theo spec §7. Memoize (max rounds = 8 cho bracketSize 256). Unit test với expected outputs từ bảng spec.
3. **`next-power-of-2.ts`**: trivial. Unit test N=1→2, 2→2, 3→4, 6→8, 16→16, 17→32.
4. **`resolve-seeds.ts`** (spec §6):
   - Input: `registrations: Registration[]`.
   - Detect mode.
   - Validate seeded values unique + in [1, N].
   - Shuffle Fisher-Yates cho unseeded.
   - Output: `Map<number, registrationId>`.
   - Random seed determinism: dùng `crypto.randomUUID()` ko cần seed lại.
5. **`single-elim-generator.ts`** (orchestrator):
   - Bước 1-7 của spec §4.
   - Output: `BracketPlan` đầy đủ.
   - **Pure** — chỉ nhận input, trả output. KHÔNG đọc/ghi DB.
6. **`build-match-tree.ts`**: gen tất cả matches R1..Rmax. Set `nextMatchId` linking. Set `isBye` cho R1 match có BYE phantom.
7. **`advance-bye-winners.ts`** (spec §11): với mỗi R1 isBye match, set winner side + fill nextMatch.sideA/B với side mới (cloned từ winner side của R1).
8. **`rearrange-swap.ts`** (spec §12):
   - Input: existing BracketPlan + swap [slotA, slotB].
   - Validate: cả 2 slot ở R1, match chứa chúng `status=pending`, R2+ chưa start.
   - Clone, swap registration ở 2 slot.
   - Re-build R1 matches bị ảnh hưởng (1 hoặc 2).
   - Re-advance bye nếu có.
   - Output: new BracketPlan.

### Adapter layer

9. **`bracket-repo.ts`**:
   - `getActiveBracket(categoryId)`.
   - `getNextVersion(categoryId)`.
   - `writeBracketPlan(plan)`: chia batch nếu > 450 ops (safety margin với 500 limit).
10. **`chunked-writer.ts`**: utility chia operations array thành chunks ≤ 450, run sequential transactions (vì cross-transaction atomicity không có; documentation warning trong code).
    - **Lưu ý**: Firestore transaction giới hạn 500 ops. Chunk = 1 transaction. Nếu vượt 500, fallback batch (`writeBatch` cũng giới hạn 500 nhưng có thể chain). MVP: cap N ≤ 128 (output 128*2 + 128 + 1 = 385 ops < 450) → 1 transaction. Cảnh báo nếu vượt.

### Handler layer

11. **`draw-bracket.ts`**:
    - Auth + organizer-guard.
    - Read category → assert `registrationStatus === 'closed'`.
    - Read approved registrations.
    - Call `singleElimGenerator(regs)` → get BracketPlan.
    - Transaction: mark old active bracket isActive=false; write new plan.
    - Audit log: `{ type: 'BRACKET_DRAWN', mode, seedSnapshot, version }`.
12. **`rearrange-bracket.ts`**:
    - Auth + organizer-guard.
    - Read active bracket + all matches.
    - Validate swap eligible.
    - Call `rearrangeSwap(...)`.
    - Transaction write new version.
    - Audit `{ type: 'BRACKET_REARRANGED', swap, oldVersion, newVersion }`.
13. **`reset-bracket.ts`** (admin/organizer override):
    - Validate: chưa match nào ở R1 status=in_progress (chỉ pending hoặc completed-from-bye).
    - Set bracket isActive=false, all matches của bracket → delete (hoặc soft delete).
    - Audit.

### UI

14. **Trang "Bốc thăm"** (`boc-tham/page.tsx`):
    - Show seed list từ Config đội (P4) — hiển thị N registrations, ai có seed.
    - Button "Bốc thăm" → confirm dialog (cảnh báo nếu đã có bracket: "Sẽ tạo version mới, version cũ bị inactive").
    - Click → call `drawBracket` → on success show bracket view.
15. **Trang "Swap slot"** (`boc-tham/swap/page.tsx`):
    - Hiển thị R1 matches list dạng card (slot 0-1, slot 2-3, ...).
    - User click 2 slot → highlight → button "Swap" → confirm → call `rearrangeBracket`.
16. **Component `bracket-view.tsx`**: render bracket tree (canvas hoặc CSS grid). MVP CSS grid responsive. Click match → modal detail.

### Tests

17. **Unit tests domain layer**:
    - `buildCrossoverSeedOrder(1..5)` match expected từ spec §7 table.
    - `nextPowerOf2` (5 cases).
    - `resolveSeeds`: full seeded / partial seeded / no seeded / invalid (out of range, duplicate).
    - `singleElimGenerator` cho 12 test case T1-T12 từ spec §15. Snapshot test: full BracketPlan output match expected.
    - `rearrangeSwap`: swap 2 slot pending → success; swap khi match đã in_progress → reject.
18. **Integration tests (emulator)**:
    - End-to-end: tạo 6 reg approved → drawBracket → verify Firestore docs (1 bracket + 7 matches + N sides).
    - Re-draw: drawBracket lần 2 → version 2 active, version 1 inactive.
    - Chunked: tạo 128 reg → drawBracket → time + ops count OK.
19. **Rules test**: organizer draw được; non-organizer không.

## Success Criteria

- [ ] 12 test case T1-T12 từ spec §15 pass đầy đủ.
- [ ] N=6 → 8-slot bracket, 2 bye cho seed 1+2, 2 R1 thường, 2 R2, 1 final, R2 sideA của 2 nửa = top seeds (verify worked example §13).
- [ ] Mode auto-detect: tất cả unseeded → random mode; có ≥1 seed → seeded mode.
- [ ] Re-draw lần 2 → version=2 active.
- [ ] Swap 2 slot R1 → bracket version mới, R2+ matches cập nhật đúng.
- [ ] Domain layer **0 firebase imports** (lint rule).
- [ ] N=128 chạy < 5s trong emulator.
- [ ] Audit log đủ thông tin để debug/replay.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bug trong crossover algorithm gây sơ đồ sai | Unit test exhaustive từ spec table; snapshot test full output |
| Race condition: 2 organizer cùng draw 1 category | Transaction read+write trong cùng tx; version increment atomic |
| Chunked write nửa chừng fail → bracket inconsistent | Single transaction cho N ≤ 128; > 128 → cảnh báo MVP không support. P4+ implement saga pattern. |
| Re-arrange phá R2+ matches đang in_progress | Pre-check status; reject với rõ message |
| Bracket size > 256 vượt Firestore limit | Hard cap N ≤ 128 ở CF (validate đầu); UI cảnh báo. |
| Random shuffle predictable | Crypto.randomUUID() cho seed; document |

## Security Considerations

- Only organizer draw/rearrange/reset.
- `reset-bracket` chỉ admin hoặc organizer + chưa có match nào in_progress.
- Audit log immutable (rules deny update/delete).
- Rate limit drawBracket (3 calls/min/category) để chống spam re-draw.

## Next Steps

→ Phase 6 (Match Operation): match start/score/end + withdrawal cascade.
