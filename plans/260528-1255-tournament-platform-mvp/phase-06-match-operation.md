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

Implement vận hành match: start match, record game score, end match (advance winner), withdrawal cascade. Trọng tài UI để nhập điểm. Match assigned-to-court gắn `refereeUserId` snapshot ở P8 — phase này chỉ implement core scoring & advance + cascade logic, dùng `match.refereeUserId` field như gate (giả định đã set sẵn từ P8 hoặc organizer override).

## Requirements

**Functional:**
- `startMatch(matchId)` → `POST /matches/:mid/start`: status `pending → in_progress`. Set `startedAt`.
- `recordGameScore(matchId, gameNumber, scoreA, scoreB)` → `POST /matches/:mid/games`: push/update phần tử trong `games[]` embedded của match, update `sideA/sideB.gamesWon`.
- `endMatch(matchId)` → `POST /matches/:mid/end`: compute winner từ games + bestOf → status `completed`, set `winnerSide`, `endedAt`, **advance winner lên nextMatch** (fill side A/B của nextMatch). Tự release court (nếu courtId != null).
- `withdraw(registrationId)` → `POST /registrations/:rid/withdraw`: cascade walkover lên tất cả future matches (pending + in_progress) của registration đó. **Match completed giữ nguyên.** Doubles: 1 trong 2 rút = cả cặp.
- Trọng tài UI: list match được gán, nhập điểm 1 trận.
- Scoring tự do: điểm không validate range, bên có điểm cao hơn = thắng game. Trọng tài quyết khi nào kết thúc trận.

**Non-functional:**
- `endMatch` p95 < 1s.
- Withdrawal cascade với 10 future matches < 2s.
- Realtime score update qua Socket.IO push (typically < 1s; target < 3s p95).

## Architecture

**Repo:** backend = `badminton-api` (NestJS, repo riêng). Frontend (`badminton-web`) = repo này.

**Files (badminton-api):**
```
src/
├── domain/
│   ├── scoring/
│   │   └── compute-match-winner.ts          # PURE: input games[], bestOf → 'A'|'B'|null
│   └── bracket/
│       ├── advance-winner.ts                # already defined P5: update nextMatch side
│       └── withdrawal-cascade.ts            # PURE: find future matches, walkover, propagate
├── modules/matches/
│   ├── matches.controller.ts                # POST /matches/:mid/start | /games | /end
│   ├── matches.service.ts                   # transaction logic + emit Socket.IO
│   └── (assign-court ở P8)
├── modules/registrations/
│   └── registrations.service.ts             # withdraw() — implement cascade (stub ở P4 → real ở đây)
└── schemas/
    └── match.schema.ts                      # Match doc với sideA/sideB + games[] embedded
```
- `matches.service` dùng Mongoose `@InjectModel(Match)` + `connection.startSession()` cho transaction. Đọc `getMatchById`, `getAllMatchesOfCategory(categoryId)` (cho cascade), `writeMatchUpdates(updates[])` qua bulkWrite trong session.

**Files (badminton-web):**
```
app/(app)/trong-tai/
├── page.tsx                                 # list matches assigned (GET /matches?refereeUserId=me&status=pending,in_progress)
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
  - `badminton-api` guards: `MatchScoringGuard` (referee snapshot OR organizer) áp cho start/game/end; serializer cho match response (ẩn PII của VĐV).
  - `badminton-api` `registrations.service.ts` (đã có stub P4, implement đầy đủ withdraw cascade)
- Delete: none

## Implementation Steps

### Domain layer (pure — KHÔNG import @nestjs/* hay mongoose)

1. **`compute-match-winner.ts`** (pure):
   ```ts
   function computeWinner(games: Game[], bestOf: 1|3|5): 'A' | 'B' | null {
     // count games won by side
     const aWins = games.filter(g => g.scoreSideA > g.scoreSideB).length
     const bWins = games.length - aWins
     const target = Math.ceil(bestOf / 2)  // 1, 2, 3
     if (aWins >= target) return 'A'
     if (bWins >= target) return 'B'
     return null  // chưa đủ game thắng
   }
   ```
   Note: KHÔNG enforce phải đủ điểm trong 1 game (rule: điểm cao hơn = thắng game, không có validate 21+). Chỉ cần đếm số game đã được tạo và winner đã set ở mỗi game.
2. **`advance-winner.ts`** (đã định nghĩa P5, sử dụng ở đây):
   - Input: `match`, `winnerSide`, `allMatchesMap`.
   - Read `match.nextMatchId`.
   - Compute `nextSide` = `match.slotIndex % 2 === 0 ? 'A' : 'B'`.
   - Output: updates `nextMatch.sideA` hoặc `sideB` với side mới (clone từ winner side hiện tại — copy registrationIds + userIds).
   - Nếu `match.nextMatchId == null` → final, không advance.
3. **`withdrawal-cascade.ts`** (pure):
   - Input: `registrationId`, `categoryId`, `allMatchesOfCategory` (mỗi match có sideA/sideB embedded).
   - Find matches có sideA/sideB chứa registration đó.
   - For each match: nếu `status IN [pending, in_progress]` → mark walkover, side đối diện thắng (`winnerSide`), **recurse advance up chain** (vì side đối diện giờ là winner, có thể propagate lên nhiều round).
   - Output: list of match updates (mỗi update đụng 1 match doc).
   - **KHÔNG đụng match completed.**

### Repository / service

4. **`matches.service.ts`** (Mongoose):
   - `getMatchById(matchId)`.
   - `getAllMatchesOfCategory(categoryId)` (cho cascade — index `{categoryId, round, slotIndex}`).
   - `writeMatchUpdates(updates[], session)` — bulkWrite trong session transaction.
   - Mỗi match là 1 document (sideA/sideB + games[] embedded) → mutation đụng 1 doc, tránh lock chéo.

### Endpoints / service methods

5. **`POST /matches/:mid/start`** (start-match):
   - Guard: `userId == match.refereeUserId OR isOrganizer(tid)` (`MatchScoringGuard`).
   - Validate `match.status === 'pending'` AND `match.sideA AND match.sideB` đã có người (không phải bye).
   - Update: `status = 'in_progress', startedAt = now`.
   - Audit; emit `match:updated` → room `match:{mid}` + `category:{cid}`.
6. **`POST /matches/:mid/games`** (record-game-score):
   - Guard: same.
   - Validate `match.status === 'in_progress'`.
   - Validate `gameNumber === max(existing) + 1` (không ngắt quãng).
   - Compute `winnerSide` cho game: `scoreA > scoreB ? 'A' : 'B'` (tie? API reject "Phải có người thắng").
   - Push/update phần tử trong `games[]` embedded; recompute `sideA/sideB.gamesWon`.
   - **Lưu ý**: Edit score 1 game đã có → P7 sẽ handle cascade. Phase này chỉ implement create + simple update (không cross-game side effect).
   - Audit; emit `match:updated`.
7. **`POST /matches/:mid/end`** (end-match):
   - Guard: same.
   - Read match + games.
   - Call `computeWinner(games, bestOf)`.
   - Nếu winner null → reject "Chưa đủ game thắng".
   - Mongo session transaction (`session.withTransaction`):
     - Match: `status='completed', winnerSide, endedAt=now`.
     - Advance winner → nextMatch update (fill side đúng).
     - Release court (if `courtId`): `court.currentMatchId=null, status='available'` (giữ `currentRefereeUserId`).
   - Audit; emit `match:updated` (match hiện tại + nextMatch) + `court:updated` → room `tournament:{tid}`.
8. **`POST /registrations/:rid/withdraw`** (rewrite từ stub P4):
   - Guard: owner (`userId == registration.userId`) | organizer.
   - Read registration → set `status = withdrawn`.
   - Call `withdrawalCascade(...)`.
   - Mongo session transaction: batch update affected matches (+ release court nếu match in_progress).
   - Audit `{ type: 'REGISTRATION_WITHDRAWN', affectedMatchIds, propagationChain }`; emit `match:updated` (mỗi match) + `bracket:updated`.

### UI (badminton-web)

9. **Trang trọng tài** (`/trong-tai`):
   - Fetch `GET /matches?refereeUserId=me&status=pending,in_progress` (TanStack Query).
   - Card list: tên category, side A vs side B, status, scheduledAt, court.
   - Click card → match scoring page.
10. **Match scoring page** (`/trong-tai/[matchId]`):
    - Header: tên category, vòng (R1/QF/SF/F), best-of-N.
    - 2 cột side A/B với tên VĐV (đôi: 2 tên).
    - Section "Games": list game với điểm A-B + winner badge.
    - Button "Bắt đầu trận" (chỉ hiện khi pending → `POST /matches/:mid/start`).
    - Section nhập điểm game đang chơi: input scoreA + scoreB, button "Lưu điểm game này" (`POST /matches/:mid/games`).
    - Button "Game tiếp theo" tăng gameNumber.
    - Button "Kết thúc trận" (chỉ enable khi compute winner != null → `POST /matches/:mid/end`).
    - Realtime: subscribe Socket.IO room `match:{mid}` (event `match:updated`) qua `lib/socket.ts`.
11. **Withdraw button** (registration detail page từ P4):
    - Confirm dialog liệt kê match sẽ walkover.
    - Call `POST /registrations/:rid/withdraw`.

### Authorization (thay firestore.rules)

12. **Guards + serializer (NestJS)**:
    - Match read: `@Public()` cho public bracket (P9) đi qua serializer ẩn PII VĐV (chỉ trả displayName/avatar). Read trong app context = `AuthenticatedGuard`.
    - Match write (start/games/end): `MatchScoringGuard` — cho phép nếu `req.user.id == match.refereeUserId` (snapshot) HOẶC `TournamentRoleGuard('organizer')`. Client KHÔNG ghi DB trực tiếp; mọi mutation qua endpoint.
    - Games + sides nằm embedded trong match doc → không cần authz riêng.

### Tests (Jest)

13. **Unit tests domain** (Jest):
    - `computeWinner`: bestOf=1 + 1 game A win → A; bestOf=3 + 2/3 game A win → A; bestOf=3 + 1/3 → null; bestOf=5 + 2/5 → null; etc.
    - `withdrawalCascade`:
      - User A có R1 completed (lost), R2 N/A → withdraw → không có match nào update.
      - User A có R1 won (completed), R2 pending → withdraw → R2 walkover, opponent advance.
      - User A có R1 in_progress → withdraw → R1 walkover.
14. **E2E tests** (Jest + supertest + mongodb-memory-server, replica set):
    - Full flow: draw bracket → `POST /matches/:r1/start` → `POST /matches/:r1/games` × 3 (best-of-3) → `POST /matches/:r1/end` → verify nextMatch sideA filled.
    - Withdrawal during in_progress match → walkover + court released.

## Success Criteria

- [ ] Trọng tài thấy đúng list match được gán, không thấy match người khác.
- [ ] Nhập điểm 3 game best-of-3 → endMatch tự advance winner lên nextMatch.
- [ ] Withdrawal: R1 completed giữ nguyên, R2 pending → walkover.
- [ ] Realtime: client UI cập nhật điểm qua Socket.IO < 3s sau khi trọng tài save.
- [ ] Match completed → court tự release (nếu có courtId).
- [ ] Audit log đầy đủ.
- [ ] Domain unit tests + e2e tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Tie game (scoreA == scoreB) ai cho phép? | API reject, trọng tài phải nhập điểm tới khi có winner |
| Advance winner conflict (2 winner đẩy về cùng side) | Không xảy ra: mỗi match chỉ 1 nextMatchId + nextSide deterministic theo slotIndex |
| Withdrawal cascade quá sâu (10 vòng) → transaction runtime | Cap N ≤ 128 ở P5 → max 7 vòng cascade; mỗi match 1 doc embed gọn → an toàn |
| Trọng tài quên endMatch | UI nhắc "Bạn đủ điều kiện kết thúc trận" badge sau khi compute winner ≠ null |
| Race: 2 trọng tài cùng endMatch (organizer + assigned) | Transaction check `status == 'in_progress'` đầu → second call reject |
| Game number ngắt quãng (game 1, 3, skip 2) | Validate `gameNumber == max(existing) + 1` |

## Security Considerations

- `POST /matches/:mid/games` chỉ `refereeUserId` (snapshot) hoặc organizer (qua `MatchScoringGuard`).
- Audit log immutable (service không update/delete `auditLogs`).
- Score edit (sửa game đã có) chuyển P7 — phase này KHÔNG cho edit, chỉ tạo mới.
- Serializer loại PII (`identity.nationalId`, `phone`, `email`) khỏi mọi match response.

## Next Steps

→ Phase 7 (Edit Score & Cascade Revert): organizer override edit điểm + cascade revert chain.
