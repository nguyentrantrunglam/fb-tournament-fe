# phase-status

Hiển thị trạng thái tất cả 10 phases của MVP plan.

## Usage

```
/phase-status
```

## Instructions

1. Đọc tất cả 10 phase files trong `plans/260528-1255-tournament-platform-mvp/`:
   - `phase-01-project-setup.md`
   - `phase-02-auth-and-user.md`
   - `phase-03-tournament-and-category.md`
   - `phase-04-registration-and-payment.md`
   - `phase-05-bracket-generation.md`
   - `phase-06-match-operation.md`
   - `phase-07-edit-score-and-cascade-revert.md`
   - `phase-08-operations-console-and-schedule.md`
   - `phase-09-public-views-and-realtime.md`
   - `phase-10-demo-and-polish.md`

2. Từ frontmatter `status:` của mỗi file, xây bảng tổng kết:

```
Phase | Tên                              | Status   | Effort
------|----------------------------------|----------|-------
  1   | Project Setup                    | ✅ done  | 2-3d
  2   | Auth and User                    | 🔄 wip   | 3-4d
  3   | Tournament and Category          | ⏳ pending| 3-4d
  ...
```

Status icons:
- `done` → ✅
- `wip` / `in-progress` → 🔄
- `pending` → ⏳
- `blocked` → 🚫

3. Hiển thị phase tiếp theo cần implement (pending đầu tiên không bị blocked).

4. Nếu có phase nào bị blocked, liệt kê dependency còn thiếu.

5. Tổng kết: `X/10 phases done — Tiếp theo: Phase N (tên)`
