---
phase: 6
title: "Match Operation"
status: pending
priority: P1
effort: "4-5d"
dependencies: [5]
---

# Phase 6: Match Operation

## Overview

Implement vận hành match: start match, record game score, end match (advance winner), withdrawal cascade. Trọng tài UI để nhập điểm. Match assigned-to-court gắn refereeUid snapshot ở P8 — phase này chỉ implement core scoring & advance + cascade logic, dùng `match.refereeUid` field như gate (giả định đã set sẵn từ P8 hoặc admin override).

## Requirements

**Functional:**
- `startMatch(matchId)`: status `pending → in_progress`. Set `startedAt`.
- `recordGameScore(matchId, gameNumber, scoreA, scoreB)`: tạo/update Game doc, update `MatchSide.gamesWon`.
- `endMatch(matchId)`: compute winner từ games + bestOf → status `completed`, set `winnerSideId`, `endedAt`, **advance winner lên nextMatch** (fill side A/B của nextMatch). Tự release court (nếu courtId != null).
- `withdraw(registrationId)`: cascade walkover lên tất cả future matches (pending + in_progress) của registration đó. **Match completed giữ nguyên.** Doubles: 1 trong 2 rút = cả cặp.
- Trọng tài UI: list match được gán, nhập điểm 1 trận.
- Scoring tự do: điểm không validate range, bên có điểm cao hơn = thắng game. Trọng tài quyết khi nào kết thúc trận.

**Non-functional:**
- `endMatch` p95 < 1s.
- Withdrawal cascade với 10 future matches < 2s.
- Realtime score update từ Firestore listener < 3s.

## Architecture

**Files:**
```
functions/src/
├── domain/
│   ├── scoring/
│   │   └── compute-match-winner.ts          # input: games[], bestOf → winnerSide | null (not done)
│   └── bracket/
│       ├── advance-winner.ts                # already defined P5: update nextMatch side
│       └── withdrawal-cascade.ts            # find future matches, walkover, propagate
├── handlers/match/
│   ├── start-match.ts
│   ├── record-game-score.ts
│   ├── end-match.ts                         # compute + advance + release court
│   └── (assign-match-to-court.ts ở P8)
├── handlers/registration/
│   └── withdraw.ts                          # UPDATE: implement cascade (stub ở P4 → real ở đây)
└── adapters/firestore/
    └── match-repo.ts                        # read/write match + sides + games

app/(app)/trong-tai/
├── page.tsx                                 # list matches assigned (CG query: refereeUid == uid AND status IN [pending, in_progress])
└── [matchId]/page.tsx                       # nhập điểm 1 trận
                                             # UI: 2 cột side A/B, danh sách game, nhập điểm
                                             # Buttons: "Bắt đầu trận", "Game mới", "Kết thúc trận"

components/match/
├── match-scoring-form.tsx                   # form nhập điểm 1 game
├── match-score-board.tsx                    # display score breakdown
└── withdraw-button.tsx                      # cho participant + organizer
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `firestore.rules`: thêm rule `matches/*` (read theo public/private, write CF only)
  - `firestore.rules`: thêm rule `games/*` (subcollection of match), `sides/*`
  - `functions/src/handlers/registration/withdraw.ts` (đã có stub P4, implement đầy đủ)
- Delete: none

## Implementation Steps

### Domain layer

1. **`compute-match-winner.ts`** (pure):
   ```ts
   function computeWinner(games: Game[], bestOf: 1|3|5): SideId | null {
     // count games won by side
     const aWins = games.filter(g => g.scoreSideA > g.scoreSideB).length
     const bWins = games.length - aWins
     const target = Math.ceil(bestOf / 2)  // 1, 2, 3
     if (aWins >= target) return 'A'
     if (bWins >= target) return 'B'
     return null  // chưa đủ game thắng
   }
   ```
   Note: KHÔNG enforce phải đủ điểm trong 1 game (rule: điểm cao hơn = thắng game, không có validate 21+). Vì vậy chỉ cần đếm số game đã được tạo và winner đã set ở mỗi game.
2. **`advance-winner.ts`** (đã định nghĩa P5, sử dụng ở đây):
   - Input: `match`, `winnerSide`, `allMatchesMap`.
   - Read `match.nextMatchId`.
   - Compute `nextSide` = `match.slotIndex % 2 === 0 ? 'A' : 'B'`.
   - Output: updates `nextMatch.sideA` hoặc `sideB` với side mới (clone từ winner side hiện tại — copy registrationIds + userIds).
   - Nếu `match.nextMatchId == null` → final, không advance.
3. **`withdrawal-cascade.ts`** (pure):
   - Input: `registrationId`, `categoryId`, `allMatchesOfCategory`, `allSides`.
   - Find sides chứa registration đó.
   - For each side: tìm match → nếu `status IN [pending, in_progress]` → mark walkover, side đối diện thắng, **recurse advance up chain** (vì side đối diện giờ là winner, có thể propagate lên nhiều round).
   - Output: list of match updates + side updates.
   - **KHÔNG đụng match completed.**

### Adapter

4. **`match-repo.ts`**:
   - `getMatch(matchId)`.
   - `getMatchWithSides(matchId)`.
   - `getAllMatchesOfCategory(categoryId)` (cho cascade).
   - `writeMatchUpdates(updates[])` — batch.

### Handler

5. **`start-match.ts`**:
   - Auth + check `uid == match.refereeUid OR isOrganizer(tid)`.
   - Validate `match.status === 'pending'` AND `match.sideAId AND match.sideBId` (cả 2 side đã có người, không phải bye).
   - Update: `status = 'in_progress', startedAt = now`.
   - Audit.
6. **`record-game-score.ts`**:
   - Auth + same guard.
   - Validate `match.status === 'in_progress'`.
   - Validate `gameNumber > 0`.
   - Compute `winnerSide` cho game: `scoreA > scoreB ? 'A' : 'B'` (tie? CF reject "Phải có người thắng").
   - Upsert `games/{gameNumber}` doc.
   - Update `sides/{winnerSideId}.gamesWon += 1` nếu game mới hoặc swap winner.
   - **Lưu ý**: Edit score 1 game đã có → P7 sẽ handle cascade. Phase này chỉ implement create + simple update (không cross-game side effect).
   - Audit.
7. **`end-match.ts`**:
   - Auth + same guard.
   - Read match + games.
   - Call `computeWinner(games, bestOf)`.
   - Nếu winner null → reject "Chưa đủ game thắng".
   - Transaction:
     - Match: `status='completed', winnerSideId, endedAt=now`.
     - Advance winner → nextMatch update.
     - Release court (if `courtId`): `court.currentMatchId=null, status='available'`.
   - Audit.
8. **`withdraw.ts`** (rewrite từ stub P4):
   - Auth + check (chính chủ hoặc organizer).
   - Read registration → set `status = withdrawn`.
   - Call `withdrawalCascade(...)`.
   - Batch write updates.
   - Audit `{ type: 'REGISTRATION_WITHDRAWN', affectedMatchIds, propagationChain }`.

### UI

9. **Trang trọng tài** (`/trong-tai`):
   - CG query: `matches where refereeUid == currentUid AND status IN [pending, in_progress]`.
   - Card list: tên category, side A vs side B, status, scheduledAt, court.
   - Click card → match scoring page.
10. **Match scoring page** (`/trong-tai/[matchId]`):
    - Header: tên category, vòng (R1/QF/SF/F), best-of-N.
    - 2 cột side A/B với tên VĐV (đôi: 2 tên).
    - Section "Games": list game với điểm A-B + winner badge.
    - Button "Bắt đầu trận" (chỉ hiện khi pending).
    - Section nhập điểm game đang chơi: input scoreA + scoreB, button "Lưu điểm game này" (call recordGameScore).
    - Button "Game tiếp theo" tăng gameNumber.
    - Button "Kết thúc trận" (chỉ enable khi compute winner != null).
    - Realtime: Firestore listener match doc + games subcollection.
11. **Withdraw button** (registration detail page từ P4):
    - Confirm dialog liệt kê match sẽ walkover.
    - Call `withdraw` CF.

### Rules

12. **Firestore rules thêm**:
    ```
    match /tournaments/{tid}/categories/{cid}/matches/{mid} {
      allow read: if isTournamentReadable(tid);
      allow write: if false;
      match /games/{gameNum} {
        allow read: if isTournamentReadable(tid);
        allow write: if false;
      }
      match /sides/{sid} {
        allow read: if isTournamentReadable(tid);
        allow write: if false;
      }
    }
    ```

### Tests

13. **Unit tests domain**:
    - `computeWinner`: bestOf=1 + 1 game A win → A; bestOf=3 + 2/3 game A win → A; bestOf=3 + 1/3 → null; bestOf=5 + 2/5 → null; etc.
    - `withdrawalCascade`:
      - User A có R1 completed (lost), R2 N/A → withdraw → không có match nào update.
      - User A có R1 won (completed), R2 pending → withdraw → R2 walkover, opponent advance.
      - User A có R1 in_progress → withdraw → R1 walkover.
14. **Integration tests** (emulator):
    - Full flow: drawBracket → startMatch R1-0 → recordGameScore × 3 (best-of-3) → endMatch → verify nextMatch sideA filled.
    - Withdrawal during in_progress match.

## Success Criteria

- [ ] Trọng tài thấy đúng list match được gán, không thấy match người khác.
- [ ] Nhập điểm 3 game best-of-3 → endMatch tự advance winner lên nextMatch.
- [ ] Withdrawal: R1 completed giữ nguyên, R2 pending → walkover.
- [ ] Realtime: client UI cập nhật điểm < 3s sau khi trọng tài save.
- [ ] Match completed → court tự release (nếu có courtId).
- [ ] Audit log đầy đủ.
- [ ] Domain tests + integration tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Tie game (scoreA == scoreB) ai cho phép? | CF reject, trọng tài phải nhập điểm tới khi có winner |
| Advance winner conflict (2 winner đẩy về cùng side) | Không xảy ra: mỗi match chỉ 1 nextMatchId + nextSide deterministic theo slotIndex |
| Withdrawal cascade quá sâu (10 vòng) → transaction limit | Cap N ≤ 128 ở P5 → max 7 vòng cascade < 500 ops |
| Trọng tài quên endMatch | UI nhắc "Bạn đủ điều kiện kết thúc trận" badge sau khi compute winner ≠ null |
| Race: 2 trọng tài cùng endMatch (organizer + assigned) | Transaction check `status == 'in_progress'` đầu → second call reject |
| Game number ngắt quãng (game 1, 3, skip 2) | Validate `gameNumber == max(existing) + 1` |

## Security Considerations

- `recordGameScore` chỉ refereeUid hoặc organizer.
- Audit log immutable.
- Score edit (sửa game đã có) chuyển P7 — phase này KHÔNG cho edit, chỉ tạo mới.

## Next Steps

→ Phase 7 (Edit Score & Cascade Revert): organizer override edit điểm + cascade revert chain.
