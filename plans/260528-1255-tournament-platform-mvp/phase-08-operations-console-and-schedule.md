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

Implement model 2 cấp gán: (1) trọng tài vào court (giữ cố định), (2) match vào court (snapshot refereeUid). Plus schedule config tính `scheduledAt` dự kiến cho từng match từ start time + duration + court count. Trang Operations Console cho BTC quản lý live.

**Tham chiếu spec đầy đủ:** [docs/system-architecture.md](../../../docs/system-architecture.md) §8.4 (Operations Console) + §8.9 (Schedule config).

**Cập nhật từ mockup (UI đã dựng):**
- **Trang Lịch & trận** = quản lý **thứ tự thi đấu** (`match.order`, kéo-thả đổi) → tính lại `scheduledAt`. **KHÔNG gán sân ở đây** — gán match→sân chỉ ở Vận hành LIVE. Cần CF `reorderMatches(categoryId, orderedIds[])`.
- **Nhập tỉ số thủ công** (BTC override): từ trang Lịch, dialog nhập điểm từng game cho trận pending/in_progress → reuse `recordGameScore` + `endMatch`. Trận completed/in_progress khoá kéo đổi thứ tự.

## Requirements

**Functional:**
- `assignRefereeToCourt(courtId, refereeUid | null)`: gán/đổi trọng tài hiện tại của sân.
- `assignMatchToCourt(matchId, courtId)`: gán match vào sân available → snapshot `match.refereeUid = court.currentRefereeUid`, court busy.
- `releaseCourt(courtId)`: manual release (auto trigger trong `endMatch` từ P6 đã có).
- `setScheduleConfig(categoryId, startAt, estimatedMinPerMatch)`: tính `scheduledAt` cho từng match theo formula spec.
- Operations Console UI:
  - Bảng theo court (mỗi court 1 row): trọng tài hiện tại + match đang chạy + filter pending matches gán nhanh.
  - Drag-drop hoặc dropdown gán match → court.
  - Cảnh báo trùng giờ VĐV, trọng tài kẹt 2 sân.
- Match start auto-release: `endMatch` đã handle ở P6, verify lại work với `assignMatchToCourt` snapshot.

**Non-functional:**
- Operations Console listener subscribe nhiều entity (matches CG + courts + roles); chỉ subscribe matches của 1 tournament cùng status pending/in_progress.
- Console load < 2s cho giải 100 matches.
- Drag-drop response feedback < 500ms.

## Architecture

**Files:**
```
functions/src/
├── handlers/court/
│   ├── create-court.ts                      # đã có P3, mở rộng với assignedReferee fields
│   ├── update-court.ts
│   ├── delete-court.ts
│   ├── assign-referee-to-court.ts           # mới
│   └── release-court.ts                     # manual; auto trigger trong endMatch (P6)
├── handlers/match/
│   └── assign-match-to-court.ts             # mới: validate + snapshot refereeUid + busy court
├── handlers/category/
│   └── set-schedule-config.ts               # tính scheduledAt cho matches của bracket active

app/(app)/giai/[slug]/dieu-hanh/
├── page.tsx                                 # Operations Console main
└── lich/
    └── page.tsx                             # Schedule view + config form

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
  - `functions/src/handlers/match/end-match.ts` (P6): xác nhận release court trong tx
  - `functions/src/domain/scheduling/`: thêm `compute-scheduled-at.ts` pure function
  - `firestore.rules`: thêm rule cho courts (read theo tournament public, write CF only)
- Delete: none

## Implementation Steps

### Domain scheduling

1. **`compute-scheduled-at.ts`** (pure):
   ```ts
   function computeScheduledAt(
     matches: Match[],   // sorted by round ASC, slotIndex ASC
     startAt: Timestamp,
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

### CF handlers

3. **`assign-referee-to-court.ts`**:
   - Auth + organizer-guard.
   - Validate refereeUid có role `referee` trên tournament (read `tournaments/{tid}/roles/{refereeUid}`).
   - Update court: `currentRefereeUid`, `refereeAssignedAt = now`.
   - Audit log.
4. **`assign-match-to-court.ts`**:
   - Auth + organizer-guard.
   - Validate (transaction):
     - `court.status === 'available'` AND `court.currentMatchId === null`.
     - `court.currentRefereeUid != null` (sân phải có trọng tài).
     - `match.status === 'pending'`.
     - `match.sideAId AND match.sideBId` (cả 2 side có người, không phải bye match đã completed).
   - Update atomic:
     - `match.courtId = courtId`.
     - `match.refereeUid = court.currentRefereeUid` (SNAPSHOT).
     - `court.currentMatchId = matchId`.
     - `court.status = 'busy'`.
   - Audit log.
5. **`release-court.ts`** (manual override):
   - Validate: `court.currentMatchId == null` (đã release) → no-op, hoặc match đó status `completed/walkover` → safe to release.
   - Update court available.
6. **Update `end-match.ts` (P6)**: trong cùng transaction, nếu `match.courtId != null` → `court.currentMatchId = null, status = 'available'`. **Đã spec ở P6, verify implementation.**
7. **`set-schedule-config.ts`**:
   - Auth + organizer-guard.
   - Read active bracket + all non-bye matches (sorted by round, slotIndex).
   - Read courtCount = courts của tournament.
   - Validate courtCount > 0, estimatedMinPerMatch > 0.
   - Compute scheduledAt cho từng match.
   - Update `category.scheduleStartAt, estimatedMinPerMatch`.
   - Batch update matches với `scheduledAt`.
   - Audit log.

### UI Operations Console

8. **Layout** (`/giai/[slug]/dieu-hanh`):
   - Tabs: "Theo sân" (default) | "Theo hạng mục" | "Timeline".
   - **Tab "Theo sân"** (chính):
     - 1 row mỗi court (lấy từ `courts` của tournament).
     - Col 1: tên sân + trọng tài hiện tại (dropdown đổi).
     - Col 2: match đang chạy (status in_progress + courtId == thisCourt) → click → match scoring page.
     - Col 3: button "Gán match" mở picker dropdown các match pending của tournament (sort theo scheduledAt).
   - **Tab "Theo hạng mục"**: list categories, mỗi category list match pending + button gán court.
   - **Tab "Timeline"**: visual schedule theo giờ, mỗi court 1 column.
9. **Match assignment picker**:
   - List matches pending (`status === 'pending' AND sideA + sideB filled`).
   - Sort by scheduledAt ASC.
   - Show category code + round + side names + scheduledAt.
   - Click → confirm dialog "Gán match X vào Sân Y? Trọng tài Z sẽ chấm trận này." → call `assignMatchToCourt`.
10. **Referee picker**:
    - List user có role `referee` của tournament (CG query `roles where role==referee`).
    - Show displayName + avatar.
    - Click → confirm "Đổi trọng tài sân X từ A → B? Match đang chạy KHÔNG ảnh hưởng (snapshot giữ trọng tài cũ)." → call `assignRefereeToCourt`.
11. **Conflict warning banner**:
    - Computed client-side từ matches có scheduledAt:
      - VĐV trùng giờ: cùng userId xuất hiện ở 2 matches scheduledAt overlap (within estimatedMinPerMatch).
      - Trọng tài kẹt: cùng refereeUid ở 2 court busy đồng thời.
    - Hiển thị banner top với detail expandable.

### UI Schedule

12. **Schedule config form** (`/giai/[slug]/dieu-hanh/lich`):
    - Per category section: input startAt (datetime) + estimatedMinPerMatch (number).
    - Show courtCount của tournament.
    - Preview: "Tổng số match X, mỗi sân chạy Y match liên tiếp, dự kiến kết thúc Z".
    - Save → call `setScheduleConfig`.

### Tests

13. **Unit test `computeScheduledAt`**:
    - 8 matches, 2 courts, 45 min/match: t=0,0,45,45,90,90,135,135.
    - 1 match, 3 courts: t=0.
    - Skip bye matches.
14. **Integration tests** (emulator):
    - Assign referee to court → court.currentRefereeUid set.
    - Assign match to court → match.refereeUid snapshot, court busy.
    - Đổi referee court trong khi match in_progress → match.refereeUid KHÔNG đổi (snapshot preserved).
    - endMatch → court tự release.
    - setScheduleConfig → matches có scheduledAt đúng formula.
15. **Rules test**: organizer assign được; referee KHÔNG assign được.

## Success Criteria

- [ ] Gán trọng tài vào court (giữ cố định) → court hiển thị tên trọng tài.
- [ ] Gán match pending vào court available → match.refereeUid snapshot đúng.
- [ ] Match end → court tự release, sẵn sàng nhận match khác.
- [ ] Đổi trọng tài court khi match in_progress → match.refereeUid không đổi.
- [ ] setScheduleConfig: matches có scheduledAt đúng formula (verify với test data 16 matches, 4 courts, 30 min).
- [ ] Operations Console hiển thị realtime: assign 1 match → court row update < 3s.
- [ ] Conflict banner phát hiện VĐV trùng giờ + trọng tài kẹt.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race: 2 organizer cùng gán match vào sân | Transaction check court.status đầu → second call reject |
| Drag-drop UX phức tạp với mobile | MVP: dropdown click thay drag (KISS); drag-drop desktop only ở P5+ |
| Schedule config gọi nhiều lần → matches scheduledAt thay đổi liên tục | Cảnh báo "Đã có schedule, ghi đè?" trước khi save |
| courtCount = 0 → divide by zero | Validate trong CF |
| Estimated time không khớp thực tế → matches sau bị "trễ" lý thuyết | UI chỉ display, không enforce; BTC adjust khi cần |
| Trọng tài chưa được gán court mà match assign vào | CF reject "Sân chưa có trọng tài, gán trọng tài trước" |

## Security Considerations

- Only organizer assign/release.
- Referee role validate strict (tournament-scoped role).
- Audit log mọi thay đổi assignment.
- Rate limit `assignMatchToCourt` (20/min/user — BTC vận hành thực tế cần burst).

## Next Steps

→ Phase 9 (Public Views & Realtime): trang public homepage + tournament + bracket + lịch + score realtime.
