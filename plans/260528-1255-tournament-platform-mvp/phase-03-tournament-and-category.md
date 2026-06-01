---
phase: 3
title: "Tournament and Category"
status: pending
priority: P1
effort: "4-5d"
dependencies: [2]
---

# Phase 3: Tournament and Category

## Overview

Build flow setup giải đấu: organizer tạo tournament, config detail (banner/rules/sponsors/payment QR), quản lý sân, tạo category với `code` + lifecycle 3 trạng thái. Output: organizer setup xong 1 giải sẵn sàng nhận đăng ký.

## Requirements

**Functional:**
- Admin cấp `organizer` global role (extend grant-global-role từ P2).
- Tournament CRUD: basic info + detailed config.
- Banner upload (Firebase Storage).
- Rules text (rich text editor — MVP textarea, P4+ TipTap).
- Sponsors array (add/remove/edit + logo upload).
- Payment info: QR image upload + bank info text.
- `isPublic` toggle.
- Court CRUD trong tournament.
- Category CRUD: code unique trong tournament, `playerCount` + `genderRequirement`, format, bestOf, fee, deadline, maxTeams.
- Lifecycle Category: `openRegistration`, `closeRegistration` (guard 0 pending), `reopenRegistration` (chỉ trước bốc thăm).
- Validate `mixed_pair + playerCount=1` reject.

**Non-functional:**
- Tournament page (organizer view) tải < 2s.
- Banner upload progress UI.
- Form auto-save draft (nice-to-have, không bắt buộc MVP).

## Architecture

**Files:**
```
app/(app)/giai/
├── tao-moi/page.tsx                   # tạo giải basic info
├── [slug]/quan-ly/
│   ├── page.tsx                       # dashboard giải
│   ├── thong-tin/page.tsx             # config detail
│   ├── san/page.tsx                   # courts CRUD
│   ├── hang-muc/
│   │   ├── page.tsx                   # list categories
│   │   ├── tao-moi/page.tsx           # create category
│   │   └── [categoryId]/page.tsx      # edit category + lifecycle controls
│   └── layout.tsx                     # role guard

components/tournament/
├── tournament-basic-form.tsx
├── tournament-detail-form.tsx
├── sponsor-editor.tsx
├── payment-info-editor.tsx
├── court-list.tsx
├── category-form.tsx
└── category-lifecycle-controls.tsx    # buttons: open/close/reopen

functions/src/
├── handlers/tournament/
│   ├── create-tournament.ts           # basic info
│   ├── update-tournament-detail.ts    # banner/rules/sponsors/payment
│   ├── toggle-public.ts
│   └── grant-tournament-role.ts       # admin/organizer → grant 'organizer'/'referee' per tournament
├── handlers/court/
│   ├── create-court.ts
│   ├── update-court.ts
│   └── delete-court.ts                # block if any match assigned
├── handlers/category/
│   ├── create-category.ts             # validate code unique + mixed_pair guard
│   ├── update-category-config.ts
│   ├── delete-category.ts             # block if registrations exist
│   ├── open-registration.ts
│   ├── close-registration.ts          # guard 0 pending
│   └── reopen-registration.ts
└── domain/validation/category-config.ts

lib/queries/
├── use-tournament.ts                  # TanStack Query hook
├── use-categories.ts
└── use-courts.ts
```

## Related Code Files

- Create: tất cả ở Architecture trên
- Modify: 
  - `firestore.rules`: thêm rule cho `tournaments/*` + `courts/*` + `categories/*` (read public if isPublic, write only via CF)
  - `lib/auth/role-guards.ts`: add `useTournamentRole(tournamentId)` hook
- Delete: none

## Implementation Steps

1. **Extend P2 admin panel**: thêm UI cấp `organizer` global role (giờ `globalRole` enum thành `user|admin|organizer`? hay tiếp tục dùng `admin` cấp role per-tournament?).
   - **Quyết định:** dùng **per-tournament role**, không có global organizer. Admin cấp `organizer` role cho user ở 1 tournament cụ thể (sau khi tournament tồn tại). Nhưng để user tạo tournament đầu tiên, cần global flag → **thêm `globalRole: 'organizer_capable'`** cho phép user tạo tournament. Khi tournament tạo xong, owner tự động là `organizer` role của tournament đó.
2. **CF `create-tournament`:**
   - Auth-guard + check `globalRole IN ['admin', 'organizer_capable']`.
   - Tạo `tournaments/{tid}` với basic info, `ownerUid = uid`, `isPublic = false`, `status = 'draft'`.
   - Tạo `tournaments/{tid}/roles/{uid}` với role `organizer`.
   - Generate `slug` từ tên (kebab-case + timestamp suffix for uniqueness).
   - Audit log.
3. **Tournament detail form**: banner upload (Storage path `tournaments/{tid}/banner.{ext}`), rules textarea (max 5000 chars MVP), sponsors editor (array thêm/xoá), payment QR + bank info.
4. **Court CRUD**: simple list, add/edit/delete. `delete-court` reject nếu có match nào `courtId == thisCourtId`.
5. **Category CRUD**:
   - `create-category` validate:
     - `code` regex `^[A-Z0-9_-]{2,12}$`, unique trong tournament (read all categories of tournament, check).
     - `mixed_pair` only when `playerCount == 2`.
     - `bestOf IN [1, 3, 5]`.
     - `fee >= 0`.
     - `maxTeams IN [2, 256]`.
     - `registrationDeadline > now`.
   - `update-category-config`: chỉ cho phép update khi `registrationStatus = not_open`. Sau khi `open`, một số field frozen (code, playerCount, genderRequirement). `fee` có thể đổi nhưng không ảnh hưởng các registration đã có (feeSnapshot).
6. **Lifecycle endpoints**:
   - `open-registration`: not_open → open. Set `openedAt`.
   - `close-registration`: open → closed. **Guard: count pending registrations == 0**. Reject nếu > 0 với message "Còn N pending, vui lòng duyệt/từ chối hết".
   - `reopen-registration`: closed → open. **Guard: chưa có bracket active** (`tournaments/{tid}/categories/{cid}/brackets where isActive=true` rỗng).
7. **Firestore rules update**:
   ```
   match /tournaments/{tid} {
     allow read: if resource.data.isPublic == true || isOrganizer(tid) || isAdmin();
     allow create: if isSignedIn() && (globalRole IN ['admin','organizer_capable']);
     allow update, delete: if false; // CF only
   }
   match /tournaments/{tid}/{document=**} {
     allow read: if get(/databases/$(db)/documents/tournaments/$(tid)).data.isPublic == true || isOrganizer(tid) || isAdmin();
     allow write: if false;
   }
   ```
8. **UI dashboard giải** (`/giai/[slug]/quan-ly`):
   - Stats cards: số category, số registration (approved/pending/total), public toggle.
   - Quick actions: edit info, manage courts, manage categories, open public.
9. **Category lifecycle UI**: button "Mở đăng ký" → confirm dialog. "Đóng đăng ký" → modal hiển thị số pending nếu > 0 (block). "Mở lại đăng ký" → chỉ hiện khi closed + chưa bốc.
10. **Slug routing**: trang public `/giai/[slug]` map slug → tournamentId qua collection group query hoặc denormalize `slugToId/{slug}` doc.
11. **Test data seeder** (`scripts/seed-dev.ts`): tạo 1 admin + 3 user organizer-capable + 1 tournament demo + 3 category để dev nhanh.
12. **Rules tests:**
    - User thường KHÔNG tạo được tournament.
    - User organizer_capable tạo được, tự động trở thành organizer của tournament đó.
    - Non-organizer KHÔNG read tournament private (`isPublic = false`).
    - User KHÔNG ghi trực tiếp lên `tournaments/{tid}` (chỉ qua CF).

## Success Criteria

- [ ] Admin cấp `organizer_capable` cho user; user đó tạo được tournament.
- [ ] Setup tournament đầy đủ: banner upload, rules, 2 sponsors với logo, payment QR, 3 sân.
- [ ] Tạo 3 category (đơn nam, đôi nam-nữ, đôi unrestricted) với config đầy đủ.
- [ ] Lifecycle: open → close (test guard pending) → reopen.
- [ ] Code category unique enforce.
- [ ] `mixed_pair + playerCount=1` reject.
- [ ] Slug routing hoạt động.
- [ ] Rules tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race condition tạo 2 category cùng `code` | Transaction trong CF: read all + write atomic |
| Storage upload bị lag UI | Progress indicator + abort controller |
| Sponsors array lớn → doc size > 1MB | MVP cap 20 sponsors. Phase sau tách subcollection nếu cần. |
| Slug collision | Append `-{shortHash}` nếu trùng |
| Admin bootstrap mismatch (no organizer_capable user) | Document quy trình: admin grant role trước khi user tạo tournament |

## Security Considerations

- Banner/logo Storage path namespaced theo `tournaments/{tid}/` để rule control dễ.
- Storage rules: chỉ organizer của tournament được upload vào `tournaments/{tid}/*`.
- `code` validation regex chặt để tránh injection vào URL.
- Rate limit `create-tournament` (1/min/user) để chống spam.

## Next Steps

→ Phase 4 (Registration and Payment): VĐV đăng ký được, BTC duyệt + bulk + payment tracking.
