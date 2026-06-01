# implement-phase

Đọc phase plan và implement đầy đủ theo spec.

## Usage

```
/implement-phase <số phase>
```

Ví dụ: `/implement-phase 2` sẽ implement Phase 2: Auth and User.

## Instructions

Khi được gọi với số phase (ví dụ `$ARGUMENTS` = "2"):

1. **Đọc phase plan** từ `plans/260528-1255-tournament-platform-mvp/phase-0$ARGUMENTS-*.md` — nếu phase < 10 thì prefix `0`, nếu = 10 thì `10`. Dùng glob để tìm đúng file.

2. **Đọc cross-phase context** cần thiết:
   - `plans/260528-1255-tournament-platform-mvp/plan.md` — dependency chain, architectural anchors
   - `docs/system-architecture.md` — ERD, Firestore schema, CF structure
   - `docs/project-overview-pdr.md` — domain rules, acceptance criteria
   - Nếu phase >= 5: đọc thêm `docs/bracket-algorithm-spec.md`

3. **Kiểm tra dependencies**: đọc các phase trước để hiểu interface đã được implement (ví dụ phase 3 cần biết schema user từ phase 2).

4. **Implement từng task theo thứ tự trong phase plan**:
   - Domain logic thuần trước (không import firebase), đặt trong `functions/src/domain/`
   - Firestore security rules update
   - Cloud Functions handlers (`functions/src/handlers/{aggregate}/{verb}-{noun}.ts`)
   - Client-side components / pages
   - Tests (Vitest cho unit, Playwright cho E2E nếu cần)

5. **Nguyên tắc bắt buộc** (cross-phase anchors):
   - Logic portable: bracket/scoring/validation logic trong `domain/` — không import firebase
   - CF naming: `handlers/{aggregate}/{verb}-{noun}.ts`
   - PII isolation: CCCD/email chỉ trong `users/{uid}/private/identity`
   - Audit log: mọi mutation quan trọng → `tournaments/{tid}/audit/{eventId}`
   - TypeScript strict mode — không dùng `any`

6. **Sau khi implement xong**: cập nhật `status: done` trong frontmatter của phase file.

7. **Báo cáo**: liệt kê files đã tạo/sửa, acceptance criteria nào đã pass, điểm nào cần test thêm.

Nếu không có số phase trong `$ARGUMENTS`, hỏi người dùng muốn implement phase nào.
