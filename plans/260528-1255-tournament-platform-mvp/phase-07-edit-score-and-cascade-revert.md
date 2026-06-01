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

**Tham chiếu spec đầy đủ:** [docs/system-architecture.md](../../../docs/system-architecture.md) §8.5 (Organizer edit điểm — cascade revert chain) + Rule model #8.

## Requirements

**Functional:**
- `editScore(matchId, games[])`:
  - Referee guard: `uid == match.refereeUid` AND `now <= match.endedAt + 24h`.
  - Organizer guard: organizer của tournament, anytime.
  - Compute new winner.
  - Nếu winner thay đổi VÀ match đã advance: **cascade revert** chain.
- `previewCascadeRevert(matchId, newGames[])`: dry-run, trả list match sẽ bị reset.
- UI:
  - Click match completed → "Sửa điểm" (chỉ hiện nếu user có quyền).
  - Form edit games.
  - Nếu detect winner change → show confirm dialog với list match sẽ reset.
  - User confirm → commit edit + cascade.
- Cascade revert đệ quy: nếu downstream match cũng đã completed và winner cũng đổi, propagate tiếp.

**Non-functional:**
- Cascade revert với chain 5 matches: < 2s.
- UI confirm dialog hiển thị chính xác (no false positive/negative).
- Atomic: cascade thành công hoặc rollback toàn bộ.

## Architecture

**Files:**
```
functions/src/
├── domain/bracket/
│   └── cascade-revert.ts                    # pure: compute affected matches + updates
├── handlers/match/
│   ├── edit-score.ts                        # main: edit + cascade if needed
│   └── preview-cascade-revert.ts            # dry-run

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
  - `functions/src/handlers/match/`: thêm 2 endpoint
  - `lib/queries/`: hook check edit permission
- Delete: none

## Implementation Steps

### Domain layer

1. **`cascade-revert.ts`** (pure):
   ```ts
   type CascadeResult = {
     matchesToReset: Match[]    // list match sẽ reset
     gamesToDelete: { matchId, gameNumbers[] }[]
     reAdvance: { matchId, newWinnerSide, newRegistrationIds[] }
   }

   function computeCascadeRevert(
     editedMatch: Match,
     newWinnerSide: SideId,
     oldWinnerSide: SideId,
     allMatchesMap: Map<MatchId, Match>,
     allSides: Side[]
   ): CascadeResult {
     const affected: Match[] = []
     const loserRegIds = sideRegistrationIds(oldWinnerSide, allSides)

     let cursorMatchId = editedMatch.nextMatchId
     let currentLoserRegIds = loserRegIds

     while (cursorMatchId != null) {
       const next = allMatchesMap.get(cursorMatchId)
       // trận này có chứa loser cũ không?
       const containsLoser = next.sides.some(s =>
         s.registrationIds.some(rid => currentLoserRegIds.includes(rid))
       )
       if (!containsLoser) break

       affected.push(next)

       // nếu match này đã completed, lưu winner để propagate
       if (next.status === 'completed' && next.winnerSideId) {
         const nextOldWinnerRegIds = sideRegistrationIds(next.winnerSideId, allSides)
         cursorMatchId = next.nextMatchId
         currentLoserRegIds = nextOldWinnerRegIds
       } else {
         break  // pending/in_progress: chain stops here
       }
     }

     return { matchesToReset: affected, gamesToDelete: ..., reAdvance: ... }
   }
   ```
2. **Test cases cascade-revert**:
   - Match leaf (final): newWinner đổi → không có cascade (no next).
   - Match R1, R2 completed, R3 completed: cascade R2 + R3 reset.
   - Match R1, R2 pending: cascade chỉ R2 (vì R2 chưa completed → chain stop ở R2).
   - Loser cũ rơi vào bracket khác (impossible với single-elim nhưng defensive check).

### Handler layer

3. **`preview-cascade-revert.ts`**:
   - Auth + permission check (referee/organizer/admin).
   - Read match + all matches of category + sides.
   - Compute hypothetical: `newWinnerSide` = `computeWinner(newGames, bestOf)`.
   - Nếu winner không đổi → return `{ winnerChanged: false, affected: [] }`.
   - Nếu winner đổi → call `computeCascadeRevert(...)` → return affected list (rendering data: matchId, round, current winner, will become "TBD").
4. **`edit-score.ts`**:
   - Auth + permission check.
   - Referee check time window 24h.
   - Read match.
   - Compute new winner.
   - Nếu winner không đổi → simple update: rewrite games + sides.gamesWon, audit log.
   - Nếu winner đổi:
     - Compute cascade revert (same function as preview).
     - Atomic transaction:
       - Update games của edited match (delete + recreate).
       - Update `match.winnerSideId, side.gamesWon`.
       - For each affected match: status=pending, clear winnerSideId/startedAt/endedAt, delete games subcollection docs, clear side containing loser cũ.
       - Re-advance từ edited match → fill new winner into nextMatch's appropriate side.
     - Audit log đầy đủ `{ editedByUid, oldWinner, newWinner, revertedMatchIds, gamesBeforeAfter }`.

### UI

5. **Permission-aware edit button**:
   - Check `currentUser.uid === match.refereeUid && now <= endedAt + 24h` → referee edit allowed.
   - Check `isOrganizerOf(tid)` → anytime.
   - Check `isAdmin` → anytime.
   - Show button conditional.
6. **Edit form**:
   - Pre-fill current games.
   - User sửa điểm các game.
   - On submit:
     - Call `previewCascadeRevert(matchId, newGames)`.
     - Nếu `winnerChanged === false` → call `editScore` ngay → toast "Đã cập nhật".
     - Nếu `winnerChanged === true` → mở confirm dialog.
7. **Confirm dialog**:
   - Hiển thị list affected matches với hint "Trận QF#1 sẽ reset về pending (winner cũ: User X → sẽ thành TBD)".
   - Đếm tổng số trận sẽ reset.
   - 2 button: "Huỷ" / "Xác nhận, sửa và reset N trận".
   - Confirm → call `editScore` → loading → toast "Đã sửa + reset N trận" → redirect.

### Rules

8. **Firestore rules**: KHÔNG cần thêm gì (matches/games đã CF-only write). Read rules đã handle.

### Tests

9. **Unit tests cascade-revert**:
   - Chain length 0 (leaf): no cascade.
   - Chain length 1: edit R1 → cascade R2.
   - Chain length 3: edit R1 → cascade R2+R3+R4.
   - Loser không xuất hiện ở downstream (đã bị eliminated ở R2 cũ, không thuộc cascade chain): chain stops at first non-containing match.
10. **Integration tests** (emulator):
    - End-to-end: drawBracket → endMatch R1-0 (A win) → endMatch R2 (A win) → editScore R1-0 (đổi B win) → confirm cascade → verify R2 reset, R2.sideA = B.
    - Referee edit trong 24h: success.
    - Referee edit sau 24h: reject.
    - Organizer edit sau 30 ngày: success.
11. **Audit log test**: cascade event ghi đủ `revertedMatchIds`, `gamesBeforeAfter`.

## Success Criteria

- [ ] Edit không đổi winner: update games + sides.gamesWon, không cascade.
- [ ] Edit đổi winner: preview hiển thị chính xác list match sẽ reset.
- [ ] Confirm → atomic commit: edited match + cascade revert + re-advance new winner.
- [ ] Referee 24h gate hoạt động (test cả 2 chiều).
- [ ] Organizer override anytime.
- [ ] Cascade match `in_progress` ở chain: reset về pending (UI cảnh báo riêng).
- [ ] Audit log đầy đủ để replay.
- [ ] Unit + integration tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Cascade vô hạn (loop) | Chain depth giới hạn = rounds (max 7 cho N=128); compute deterministic theo nextMatchId |
| Transaction quá lớn (chain dài + games delete) | Cap N ≤ 128 → max 7 rounds → < 500 ops. P4+ chunked nếu cần. |
| Race: 2 organizer edit cùng match đồng thời | Transaction read+write trong cùng tx; second call see new state, return "Đã được edit, refresh" |
| User confirm dialog nhưng cancel ở giữa cascade | KHÔNG xảy ra: 1 transaction atomic |
| Bracket version conflict (re-arrange xảy ra giữa preview và commit) | Pre-check `bracket.version` trong tx; reject nếu khác |
| Time window 24h tính sai (timezone) | Dùng server timestamp Firebase, không trust client clock |

## Security Considerations

- Permission check strict (refereeUid match exact, không trust client claim).
- Audit log immutable (rules deny update).
- Cascade preview chỉ trả info, KHÔNG mutate (idempotent).
- Rate limit `editScore` (10/min/user) chống abuse.

## Next Steps

→ Phase 8 (Operations Console + Schedule): gán trọng tài vào court, match vào court, tính scheduledAt.
