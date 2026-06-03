---
phase: 8
title: "Operations Console and Schedule"
status: pending
priority: P1
effort: "4-5d"
dependencies: [6, 7]
---

# Phase 8: Operations Console and Schedule

## Overview

Implement model 2 cấp gán: (1) trọng tài vào court (giữ cố định), (2) match vào court (snapshot `refereeUserId`). Plus schedule config tính `scheduledAt` dự kiến cho từng match từ start time + duration + court count. Trang Operations Console cho BTC quản lý live.

**Tham chiếu spec đầy đủ:** [docs/system-architecture.md](../../../docs/system-architecture.md) §8.6 (Operations Console) + §8.9 (Schedule config).

**Cập nhật từ mockup (UI đã dựng):**
- **Trang Lịch & trận** = quản lý **thứ tự thi đấu** (`match.order`, kéo-thả đổi) → tính lại `scheduledAt`. **KHÔNG gán sân ở đây** — gán match→sân chỉ ở Vận hành LIVE. Cần endpoint `PATCH /categories/:cid/matches/order` (reorderMatches).
- **Nhập tỉ số thủ công** (BTC override): từ trang Lịch, dialog nhập điểm từng game cho trận pending/in_progress → reuse `POST /matches/:mid/games` + `POST /matches/:mid/end`. Trận completed/in_progress khoá kéo đổi thứ tự.

## Requirements

**Functional:**
- `assignRefereeToCourt(courtId, refereeUserId | null)` → `PATCH /tournaments/:tid/courts/:cid/referee`: gán/đổi trọng tài hiện tại của sân.
- `assignMatchToCourt(matchId, courtId)` → `POST /matches/:mid/assign-court`: gán match vào sân available → snapshot `match.refereeUserId = court.currentRefereeUserId`, court busy.
- `releaseCourt(courtId)` → `POST /tournaments/:tid/courts/:cid/release`: manual release (auto trigger trong `endMatch` từ P6 đã có).
- `setScheduleConfig(categoryId, startAt, estimatedMinPerMatch)` → `POST /categories/:cid/schedule`: tính `scheduledAt` cho từng match theo formula spec.
- `reorderMatches(categoryId, orderedIds[])` → `PATCH /categories/:cid/matches/order`: cập nhật `match.order` rồi tính lại `scheduledAt`.
- Operations Console UI:
  - Bảng theo court (mỗi court 1 row): trọng tài hiện tại + match đang chạy + filter pending matches gán nhanh.
  - Drag-drop hoặc dropdown gán match → court.
  - Cảnh báo trùng giờ VĐV, trọng tài kẹt 2 sân.
- Match start auto-release: `endMatch` đã handle ở P6, verify lại work với `assignMatchToCourt` snapshot.

**Non-functional:**
- Operations Console subscribe Socket.IO room `tournament:{tid}` (events `court:updated`, `match:updated`) — push state thay vì poll; chỉ render matches pending/in_progress của tournament đó.
- Console load < 2s cho giải 100 matches.
- Drag-drop response feedback < 500ms.

## Architecture

**Repo:** backend = `badminton-api` (NestJS). Frontend = `badminton-web` (repo này).

**Files (badminton-api):**
```
src/
├── modules/courts/
│   ├── courts.controller.ts                 # CRUD (P3) + PATCH .../referee + POST .../release
│   └── courts.service.ts                     # assign-referee + release
├── modules/matches/
│   ├── matches.controller.ts                # + POST /matches/:mid/assign-court
│   └── matches.service.ts                    # assignMatchToCourt: validate + snapshot refereeUserId + busy court
├── modules/categories/
│   ├── categories.controller.ts             # + POST /categories/:cid/schedule, PATCH /categories/:cid/matches/order
│   └── categories.service.ts                 # setScheduleConfig + reorderMatches
└── domain/scheduling/
    └── compute-scheduled-at.ts              # PURE function (unchanged)
```

**Files (badminton-web):**
```
app/(app)/giai/[slug]/dieu-hanh/
├── page.tsx                                 # Operations Console main
└── lich/
    └── page.tsx                             # Schedule view + config form + reorder

components/operations/
├── operations-console.tsx                   # tabbed: by-court | by-category | timeline
├── court-row.tsx                            # 1 row mỗi court với current referee + match
├── match-assignment-picker.tsx              # dropdown matches pending để gán
├── referee-picker.tsx                       # chọn từ list trọng tài của tournament
├── conflict-warning-banner.tsx              # cảnh báo trùng VĐV/referee
└── schedule-config-form.tsx                 # startAt + estimatedMinPerMatch + courts → tính & save
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `badminton-api` `matches.service.ts` `endMatch` (P6): xác nhận release court trong session transaction
  - `badminton-api` `domain/scheduling/`: thêm `compute-scheduled-at.ts` pure function
  - `badminton-api` guards: courts read = `@Public()` (qua module public ở P9) / `AuthenticatedGuard`; write = `TournamentRoleGuard('organizer')`
- Delete: none

## Implementation Steps

### Domain scheduling (pure — KHÔNG import @nestjs/* hay mongoose)

1. **`compute-scheduled-at.ts`** (pure — unchanged):
   ```ts
   function computeScheduledAt(
     matches: Match[],   // sorted by round ASC, slotIndex ASC (hoặc order)
     startAt: Date,
     estimatedMinPerMatch: number,
     courtCount: number
   ): Array<{ matchId, scheduledAt }> {
     return matches.map((m, idx) => ({
       matchId: m.id,
       scheduledAt: addMinutes(startAt, Math.floor(idx / courtCount) * estimatedMinPerMatch)
     }))
   }
   ```
2. **Lưu ý**: bye matches (R1 isBye) đã completed lúc draw, KHÔNG cần schedule. Skip trong sort.

### Endpoints / service methods (badminton-api)

3. **`PATCH /tournaments/:tid/courts/:cid/referee`** (assign-referee-to-court):
   - Guard: `TournamentRoleGuard('organizer')`.
   - Validate `refereeUserId` có role `referee` trên tournament (read `tournamentRoles` `{tournamentId, userId, role:'referee'}`).
   - Update court: `currentRefereeUserId`, `refereeAssignedAt = now`.
   - Audit log; emit `court:updated` → room `tournament:{tid}`.
4. **`POST /matches/:mid/assign-court`** (assign-match-to-court):
   - Guard: `TournamentRoleGuard('organizer')`.
   - Mongo session transaction:
     - `court.status === 'available'` AND `court.currentMatchId === null`.
     - `court.currentRefereeUserId != null` (sân phải có trọng tài).
     - `match.status === 'pending'`.
     - `match.sideA AND match.sideB` (cả 2 side có người, không phải bye match đã completed).
   - Update atomic:
     - `match.courtId = courtId`.
     - `match.refereeUserId = court.currentRefereeUserId` (SNAPSHOT).
     - `court.currentMatchId = matchId`.
     - `court.status = 'busy'`.
   - Audit log; emit `court:updated` + `match:updated`.
5. **`POST /tournaments/:tid/courts/:cid/release`** (release-court, manual override):
   - Validate: `court.currentMatchId == null` (đã release) → no-op, hoặc match đó status `completed/walkover` → safe to release.
   - Update court available.
6. **Update `endMatch` (P6)**: trong cùng session transaction, nếu `match.courtId != null` → `court.currentMatchId = null, status = 'available'` (giữ `currentRefereeUserId`). **Đã spec ở P6, verify implementation.**
7. **`POST /categories/:cid/schedule`** (set-schedule-config):
   - Guard: `TournamentRoleGuard('organizer')` + bracket phải exist.
   - Read active bracket + all non-bye matches (sorted by round, slotIndex).
   - Read courtCount = courts của tournament.
   - Validate courtCount > 0, estimatedMinPerMatch > 0.
   - Compute scheduledAt cho từng match.
   - Update `category.scheduleStartAt, estimatedMinPerMatch`.
   - Mongo batch update matches với `scheduledAt`.
   - Audit log.
8. **`PATCH /categories/:cid/matches/order`** (reorderMatches):
   - Guard: `TournamentRoleGuard('organizer')`.
   - Validate match completed/in_progress KHÔNG được đổi order (khoá).
   - Update `match.order` theo `orderedIds[]` → recompute `scheduledAt` (reuse `computeScheduledAt`).
   - Mongo batch update; audit; emit `match:updated`.

### UI Operations Console (badminton-web)

9. **Layout** (`/giai/[slug]/dieu-hanh`):
   - Tabs: "Theo sân" (default) | "Theo hạng mục" | "Timeline".
   - **Tab "Theo sân"** (chính):
     - 1 row mỗi court (lấy từ `courts` của tournament).
     - Col 1: tên sân + trọng tài hiện tại (dropdown đổi).
     - Col 2: match đang chạy (status in_progress + courtId == thisCourt) → click → match scoring page.
     - Col 3: button "Gán match" mở picker dropdown các match pending của tournament (sort theo scheduledAt).
   - **Tab "Theo hạng mục"**: list categories, mỗi category list match pending + button gán court.
   - **Tab "Timeline"**: visual schedule theo giờ, mỗi court 1 column.
   - Subscribe Socket.IO room `tournament:{tid}` → merge `court:updated` / `match:updated` vào state (TanStack Query cache).
10. **Match assignment picker**:
    - List matches pending (`status === 'pending' AND sideA + sideB filled`).
    - Sort by scheduledAt ASC.
    - Show category code + round + side names + scheduledAt.
    - Click → confirm dialog "Gán match X vào Sân Y? Trọng tài Z sẽ chấm trận này." → call `POST /matches/:mid/assign-court`.
11. **Referee picker**:
    - List user có role `referee` của tournament (`GET` tournament roles, role==referee).
    - Show displayName + avatar.
    - Click → confirm "Đổi trọng tài sân X từ A → B? Match đang chạy KHÔNG ảnh hưởng (snapshot giữ trọng tài cũ)." → call `PATCH /tournaments/:tid/courts/:cid/referee`.
12. **Conflict warning banner**:
    - Computed client-side từ matches có scheduledAt:
      - VĐV trùng giờ: cùng userId xuất hiện ở 2 matches scheduledAt overlap (within estimatedMinPerMatch).
      - Trọng tài kẹt: cùng `refereeUserId` ở 2 court busy đồng thời.
    - Hiển thị banner top với detail expandable.

### UI Schedule (badminton-web)

13. **Schedule config form** (`/giai/[slug]/dieu-hanh/lich`):
    - Per category section: input startAt (datetime) + estimatedMinPerMatch (number).
    - Show courtCount của tournament.
    - Preview: "Tổng số match X, mỗi sân chạy Y match liên tiếp, dự kiến kết thúc Z".
    - Save → call `POST /categories/:cid/schedule`.
    - Reorder thứ tự match (drag, khoá trận completed/in_progress) → `PATCH /categories/:cid/matches/order`.

### Tests (Jest)

14. **Unit test `computeScheduledAt`** (Jest):
    - 8 matches, 2 courts, 45 min/match: t=0,0,45,45,90,90,135,135.
    - 1 match, 3 courts: t=0.
    - Skip bye matches.
15. **E2E tests** (Jest + supertest + mongodb-memory-server, replica set):
    - Assign referee to court → `court.currentRefereeUserId` set.
    - Assign match to court → `match.refereeUserId` snapshot, court busy.
    - Đổi referee court trong khi match in_progress → `match.refereeUserId` KHÔNG đổi (snapshot preserved).
    - endMatch → court tự release.
    - setScheduleConfig → matches có scheduledAt đúng formula.
16. **Guard e2e test**: organizer assign được; referee KHÔNG assign được (`TournamentRoleGuard` reject).

## Success Criteria

- [ ] Gán trọng tài vào court (giữ cố định) → court hiển thị tên trọng tài.
- [ ] Gán match pending vào court available → `match.refereeUserId` snapshot đúng.
- [ ] Match end → court tự release, sẵn sàng nhận match khác.
- [ ] Đổi trọng tài court khi match in_progress → `match.refereeUserId` không đổi.
- [ ] setScheduleConfig: matches có scheduledAt đúng formula (verify với test data 16 matches, 4 courts, 30 min).
- [ ] Operations Console hiển thị realtime qua Socket.IO: assign 1 match → court row update < 3s.
- [ ] Conflict banner phát hiện VĐV trùng giờ + trọng tài kẹt.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race: 2 organizer cùng gán match vào sân | Session transaction check court.status đầu → second call reject |
| Drag-drop UX phức tạp với mobile | MVP: dropdown click thay drag (KISS); drag-drop desktop only ở P5+ |
| Schedule config gọi nhiều lần → matches scheduledAt thay đổi liên tục | Cảnh báo "Đã có schedule, ghi đè?" trước khi save |
| courtCount = 0 → divide by zero | Validate trong service |
| Estimated time không khớp thực tế → matches sau bị "trễ" lý thuyết | UI chỉ display, không enforce; BTC adjust khi cần |
| Trọng tài chưa được gán court mà match assign vào | Service reject "Sân chưa có trọng tài, gán trọng tài trước" |

## Security Considerations

- Only organizer assign/release (`TournamentRoleGuard('organizer')`).
- Referee role validate strict (tournament-scoped role qua `tournamentRoles`).
- Audit log mọi thay đổi assignment.
- Rate limit `POST /matches/:mid/assign-court` (20/min/user qua `ThrottlerModule` — BTC vận hành thực tế cần burst).

## Next Steps

→ Phase 9 (Public Views & Realtime): trang public homepage + tournament + bracket + lịch + score realtime.
