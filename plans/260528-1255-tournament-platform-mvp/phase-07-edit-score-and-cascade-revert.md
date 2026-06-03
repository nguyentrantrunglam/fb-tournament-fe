---
phase: 7
title: "Edit Score and Cascade Revert"
status: pending
priority: P1
effort: "4-5d"
dependencies: [6]
---

# Phase 7: Edit Score and Cascade Revert

## Overview

Implement edit điểm 1 trận đã hoàn thành — referee có 24h sửa điểm của trận mình ghi, organizer override không giới hạn thời gian. Khi edit thay đổi winner → **cascade revert** toàn bộ dây chuyền các match downstream loser cũ đã đi qua + re-advance winner mới. UI có dry-run preview confirm dialog trước khi commit.

**Tham chiếu spec đầy đủ:** [docs/system-architecture.md](../../../docs/system-architecture.md) §8.5 (Organizer edit điểm — cascade revert chain) + Rule model #10.

## Requirements

**Functional:**
- `editScore(matchId, games[])` → `PATCH /matches/:mid/score`:
  - Referee guard: `userId == match.refereeUserId` AND `now <= match.endedAt + 24h`.
  - Organizer guard: organizer của tournament, anytime.
  - Compute new winner.
  - Nếu winner thay đổi VÀ match đã advance: **cascade revert** chain.
- `previewCascadeRevert(matchId, newGames[])` → `POST /matches/:mid/score/preview-cascade`: dry-run, trả list match sẽ bị reset.
- UI:
  - Click match completed → "Sửa điểm" (chỉ hiện nếu user có quyền).
  - Form edit games.
  - Nếu detect winner change → show confirm dialog với list match sẽ reset.
  - User confirm → commit edit + cascade.
- Cascade revert đệ quy: nếu downstream match cũng đã completed và winner cũng đổi, propagate tiếp.

**Non-functional:**
- Cascade revert với chain 5 matches: < 2s.
- UI confirm dialog hiển thị chính xác (no false positive/negative).
- Atomic: cascade thành công hoặc rollback toàn bộ (Mongo session transaction).

## Architecture

**Repo:** backend = `badminton-api` (NestJS). Frontend = `badminton-web` (repo này).

**Files (badminton-api):**
```
src/
├── domain/bracket/
│   └── cascade-revert.ts                    # PURE: compute affected matches + updates
├── modules/matches/
│   ├── matches.controller.ts                # + PATCH /matches/:mid/score, POST /matches/:mid/score/preview-cascade
│   └── matches.service.ts                   # editScore + previewCascade methods
```

**Files (badminton-web):**
```
app/(app)/
├── trong-tai/[matchId]/edit/page.tsx       # referee edit form (24h window)
└── giai/[slug]/quan-ly/match/[matchId]/edit/page.tsx   # organizer edit anytime

components/match/
├── edit-score-form.tsx
├── cascade-revert-confirm-dialog.tsx       # show list match sẽ reset
└── permission-aware-edit-button.tsx        # check user role + time window
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `badminton-api` `matches.controller.ts` + `matches.service.ts`: thêm 2 endpoint
  - `badminton-web` `lib/api/`: hook check edit permission + call REST
- Delete: none

## Implementation Steps

### Domain layer (pure — KHÔNG import @nestjs/* hay mongoose)

1. **`cascade-revert.ts`** (pure — algorithm UNCHANGED, chỉ đổi representation: side embedded A/B, `next.games = []` thay vì xoá games subcollection):
   ```ts
   type CascadeResult = {
     matchesToReset: Match[]    // list match sẽ reset
     reAdvance: { matchId, newWinnerSide: 'A'|'B', newRegistrationIds[] }
   }

   function computeCascadeRevert(
     editedMatch: Match,
     newWinnerSide: 'A' | 'B',
     oldWinnerSide: 'A' | 'B',
     allMatchesMap: Map<MatchId, Match>
   ): CascadeResult {
     const affected: Match[] = []
     const loserRegIds = sideRegistrationIds(editedMatch, oldWinnerSide)  // winner cũ → loser

     let cursorMatchId = editedMatch.nextMatchId
     let currentLoserRegIds = loserRegIds

     while (cursorMatchId != null) {
       const next = allMatchesMap.get(cursorMatchId)
       // trận này có chứa loser cũ không? (sideA/sideB embedded)
       const containsLoser = [next.sideA, next.sideB].some(s =>
         sideRegIds(s).some(rid => currentLoserRegIds.includes(rid))
       )
       if (!containsLoser) break

       affected.push(next)

       // nếu match này đã completed, lưu winner để propagate
       if (next.status === 'completed' && next.winnerSide) {
         const nextOldWinnerRegIds = sideRegistrationIds(next, next.winnerSide)
         cursorMatchId = next.nextMatchId
         currentLoserRegIds = nextOldWinnerRegIds
       } else {
         break  // pending/in_progress: chain stops here
       }
     }

     return { matchesToReset: affected, reAdvance: ... }
   }
   ```
2. **Test cases cascade-revert**:
   - Match leaf (final): newWinner đổi → không có cascade (no next).
   - Match R1, R2 completed, R3 completed: cascade R2 + R3 reset.
   - Match R1, R2 pending: cascade chỉ R2 (vì R2 chưa completed → chain stop ở R2).
   - Loser cũ rơi vào bracket khác (impossible với single-elim nhưng defensive check).

### Endpoint / service layer (badminton-api)

3. **`POST /matches/:mid/score/preview-cascade`** (preview-cascade-revert):
   - Guard: referee | organizer (`MatchEditGuard`).
   - Read match + `getAllMatchesOfCategory(categoryId)`.
   - Compute hypothetical: `newWinnerSide = computeWinner(newGames, bestOf)`.
   - Nếu winner không đổi → return `{ winnerChanged: false, affected: [] }`.
   - Nếu winner đổi → call `computeCascadeRevert(...)` → return affected list (rendering data: matchId, round, current winner, will become "TBD").
   - Idempotent — KHÔNG mutate.
4. **`PATCH /matches/:mid/score`** (edit-score):
   - Guard: organizer (anytime) | referee (`userId == match.refereeUserId` AND trong 24h sau `endedAt`, tính bằng **server timestamp**, không trust client clock).
   - Read match.
   - Compute new winner.
   - Nếu winner không đổi → simple update: rewrite `games[]` embedded + `sideA/sideB.gamesWon`, audit log.
   - Nếu winner đổi:
     - Compute cascade revert (same function as preview).
     - Mongo session transaction (`session.withTransaction`) — atomic:
       - Update `games[]` của edited match (thay nguyên mảng).
       - Update `match.winnerSide` + `sideA/sideB.gamesWon`.
       - For each affected match: `status=pending`, clear `winnerSide/startedAt/endedAt`, set `games = []`, side chứa loser cũ → set lại TBD.
       - Re-advance từ edited match → fill new winner vào nextMatch's appropriate side (chain advance).
     - Audit log đầy đủ `{ editedByUserId, oldWinner, newWinner, revertedMatchIds, gamesBeforeAfter }`.
     - Emit `match:updated` cho mỗi match đổi + `bracket:updated` → room `category:{cid}`.

### UI (badminton-web)

5. **Permission-aware edit button**:
   - Check `currentUser.userId === match.refereeUserId && now <= endedAt + 24h` → referee edit allowed.
   - Check `isOrganizerOf(tid)` → anytime.
   - Check `isAdmin` → anytime.
   - Show button conditional.
6. **Edit form**:
   - Pre-fill current games.
   - User sửa điểm các game.
   - On submit:
     - Call `POST /matches/:mid/score/preview-cascade`.
     - Nếu `winnerChanged === false` → call `PATCH /matches/:mid/score` ngay → toast "Đã cập nhật".
     - Nếu `winnerChanged === true` → mở confirm dialog.
7. **Confirm dialog**:
   - Hiển thị list affected matches với hint "Trận QF#1 sẽ reset về pending (winner cũ: User X → sẽ thành TBD)".
   - Đếm tổng số trận sẽ reset.
   - 2 button: "Huỷ" / "Xác nhận, sửa và reset N trận".
   - Confirm → call `PATCH /matches/:mid/score` → loading → toast "Đã sửa + reset N trận" → redirect.

### Authorization (thay firestore.rules)

8. **Guards (NestJS)**: KHÔNG cần rule storage mới. `MatchEditGuard` enforce referee-24h-window vs organizer-anytime tại endpoint; read serializer giữ nguyên (ẩn PII). Client KHÔNG ghi DB trực tiếp.

### Tests (Jest)

9. **Unit tests cascade-revert** (Jest):
   - Chain length 0 (leaf): no cascade.
   - Chain length 1: edit R1 → cascade R2.
   - Chain length 3: edit R1 → cascade R2+R3+R4.
   - Loser không xuất hiện ở downstream (đã bị eliminated ở R2 cũ, không thuộc cascade chain): chain stops at first non-containing match.
10. **E2E tests** (Jest + supertest + mongodb-memory-server, replica set):
    - End-to-end: draw bracket → end R1-0 (A win) → end R2 (A win) → `PATCH /matches/:r1-0/score` (đổi B win) → confirm cascade → verify R2 reset, R2.sideA = B.
    - Referee edit trong 24h: success.
    - Referee edit sau 24h: reject.
    - Organizer edit sau 30 ngày: success.
11. **Audit log test**: cascade event ghi đủ `revertedMatchIds`, `gamesBeforeAfter`.

## Success Criteria

- [ ] Edit không đổi winner: update `games[]` + `sideA/sideB.gamesWon`, không cascade.
- [ ] Edit đổi winner: preview hiển thị chính xác list match sẽ reset.
- [ ] Confirm → atomic commit: edited match + cascade revert + re-advance new winner.
- [ ] Referee 24h gate hoạt động (test cả 2 chiều).
- [ ] Organizer override anytime.
- [ ] Cascade match `in_progress` ở chain: reset về pending (UI cảnh báo riêng).
- [ ] Audit log đầy đủ để replay.
- [ ] Unit + e2e tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Cascade vô hạn (loop) | Chain depth giới hạn = rounds (max 7 cho N=128); compute deterministic theo nextMatchId |
| Transaction quá lớn (chain dài + games reset) | Cap N ≤ 128 → max 7 rounds; mỗi match 1 doc embed gọn → runtime an toàn (Mongo không có limit 500 ops) |
| Race: 2 organizer edit cùng match đồng thời | Transaction read+write trong cùng session; second call see new state, return "Đã được edit, refresh" |
| User confirm dialog nhưng cancel ở giữa cascade | KHÔNG xảy ra: 1 transaction atomic |
| Bracket version conflict (re-arrange xảy ra giữa preview và commit) | Pre-check `bracket.version` trong transaction; reject nếu khác |
| Time window 24h tính sai (timezone) | Dùng server timestamp (NestJS), không trust client clock |

## Security Considerations

- Permission check strict (`refereeUserId` match exact, không trust client claim — guard đọc từ DB).
- Audit log immutable (service không update/delete `auditLogs`).
- Cascade preview chỉ trả info, KHÔNG mutate (idempotent).
- Rate limit `PATCH /matches/:mid/score` (10/min/user, qua `ThrottlerModule`) chống abuse.

## Next Steps

→ Phase 8 (Operations Console + Schedule): gán trọng tài vào court, match vào court, tính scheduledAt.
