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

Build flow setup giải đấu: organizer tạo tournament, config detail (banner/logo/rules/sponsors/payment QR), quản lý sân, tạo category với `code` + lifecycle 3 trạng thái. Output: organizer setup xong 1 giải sẵn sàng nhận đăng ký.

## Requirements

**Functional:**
- Admin cấp `organizer_capable` global flag (extend grant role từ P2).
- Tournament CRUD: basic info + detailed config.
- Banner / logo / QR upload (DigitalOcean Spaces qua presigned PUT URL).
- Rules text (rich text editor — MVP textarea, P4+ TipTap).
- Sponsors array (add/remove/edit + logo upload).
- Payment info: QR image upload + bank info text.
- `isPublic` toggle.
- Court CRUD trong tournament.
- Category CRUD: code unique trong tournament, `playerCount` + `genderRequirement`, format, bestOf, fee, deadline, maxTeams.
- Lifecycle Category: open / close (guard 0 pending) / reopen (chỉ trước bốc thăm).
- Validate `mixed_pair + playerCount=1` reject.

**Non-functional:**
- Tournament page (organizer view) tải < 2s.
- Banner upload progress UI.
- Form auto-save draft (nice-to-have, không bắt buộc MVP).

## Architecture

**`badminton-web` files:**
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
│   └── layout.tsx                     # role guard (đọc tournament role qua API)

components/tournament/
├── tournament-basic-form.tsx
├── tournament-detail-form.tsx
├── sponsor-editor.tsx
├── payment-info-editor.tsx
├── court-list.tsx
├── category-form.tsx
└── category-lifecycle-controls.tsx    # buttons: open/close/reopen

lib/api/
├── tournaments.ts                     # TanStack Query hooks (CRUD + detail + visibility + role)
├── categories.ts
├── courts.ts
└── storage.ts                         # presign helper (POST /storage/presign → PUT Spaces → PATCH confirm)
```

**`badminton-api` modules (NestJS):**
```
src/modules/
├── tournaments/
│   ├── tournaments.controller.ts      # POST / ; PATCH /:tid ; PATCH /:tid/visibility ; POST /:tid/roles
│   └── tournaments.service.ts         # create + slug gen + grant tournament role
├── courts/
│   ├── courts.controller.ts           # POST|PATCH|DELETE /tournaments/:tid/courts/:cid?
│   └── courts.service.ts              # delete block if any match assigned
├── categories/
│   ├── categories.controller.ts       # POST /tournaments/:tid/categories ; PATCH|DELETE /categories/:cid ;
│   │                                  #   POST /categories/:cid/registration/{open|close|reopen}
│   └── categories.service.ts
├── storage/storage.controller.ts      # POST /storage/presign (DO Spaces PUT URL)
└── domain/validation/category-config.ts   # mixed_pair + playerCount=2 only

src/common/guards/tournament-role.guard.ts  # đọc tournamentRoles theo :tid param
```

## Related Code Files

- Create: tất cả ở Architecture trên (web + api)
- Modify:
  - `common/guards/tournament-role.guard.ts`: implement `TournamentRoleGuard` từ stub P1 (đọc `tournamentRoles { tournamentId, userId, role }`)
  - serialize interceptor: `tournaments` (isPublic=false) chỉ trả cho organizer/admin
  - `lib/api/tournaments.ts`: add `useTournamentRole(tournamentId)` hook (đọc role từ API)
- Delete: none

## Implementation Steps

1. **Extend P2 admin panel**: thêm UI cấp `organizer_capable` global flag.
   - **Quyết định:** dùng **per-tournament role** (`tournamentRoles`), không có global organizer. Admin cấp `globalRole: 'organizer_capable'` cho phép user tạo tournament. Khi tournament tạo xong, owner tự động là `organizer` role của tournament đó (insert `tournamentRoles`).
2. **`POST /tournaments` (tournaments.service)**:
   - `AuthenticatedGuard` + `RolesGuard('admin'|'organizer_capable')`.
   - Tạo doc `tournaments` với basic info, `ownerUserId = userId`, `isPublic = false`, `status = 'draft'`.
   - Insert `tournamentRoles { tournamentId, userId, role: 'organizer', grantedByUserId: userId }`.
   - Generate `slug` từ tên (kebab-case + suffix); unique index `tournaments.slug` → E11000 → append `-{shortHash}`.
   - Audit log.
3. **Tournament detail form** (`PATCH /tournaments/:tid`, `TournamentRoleGuard(organizer)`): banner/logo/QR upload qua **Spaces presign** (`POST /storage/presign` → client PUT thẳng lên Spaces prefix `tournaments/{tid}/...` → `PATCH /tournaments/:tid` confirm URL), rules textarea (max 5000 chars MVP), sponsors editor, payment QR + bank info.
4. **Court CRUD** (`POST|PATCH|DELETE /tournaments/:tid/courts/:cid?`, `TournamentRoleGuard(organizer)`): simple list. DELETE reject nếu có match nào `courtId == thisCourtId`.
5. **Category CRUD**:
   - `POST /tournaments/:tid/categories` (`TournamentRoleGuard(organizer)`) validate:
     - `code` regex `^[A-Z0-9_-]{2,12}$`, unique trong tournament — compound unique index `{tournamentId, code}` (E11000 → `CATEGORY_CODE_DUPLICATE`, không cần read-all-then-check).
     - `mixed_pair` only when `playerCount == 2`.
     - `bestOf IN [1, 3, 5]`; `fee >= 0`; `maxTeams IN [2, 256]`; `registrationDeadline > now`.
   - `PATCH /categories/:cid`: chỉ update khi `registrationStatus = not_open`. Sau `open`, field frozen (code, playerCount, genderRequirement). `fee` đổi được nhưng không ảnh hưởng registration đã có (feeSnapshot).
6. **Lifecycle endpoints** (`POST /categories/:cid/registration/{open|close|reopen}`, `TournamentRoleGuard(organizer)`):
   - `open`: not_open → open. Set `openedAt`.
   - `close`: open → closed. **Guard: count pending registrations == 0**. Reject nếu > 0 với message "Còn N pending, vui lòng duyệt/từ chối hết".
   - `reopen`: closed → open. **Guard: chưa có bracket active** (`brackets { categoryId, isActive:true }` rỗng).
7. **Guards (thay firestore.rules)**:
   - `TournamentRoleGuard('organizer')` đọc `tournamentRoles` theo `:tid` + `req.user.id`.
   - Public read `tournaments`/`categories` (isPublic=true) → `@Public()` `GET /public/*` (module `public/`, xem system-arch §4) — không nằm trong phase này nhưng guard đã chuẩn bị.
   - `tournaments` (isPublic=false): `AuthenticatedGuard` + service check organizer/admin.
   - Mọi write `tournaments`/`courts`/`categories` chỉ qua endpoint có guard (không "client ghi DB trực tiếp").
8. **UI dashboard giải** (`/giai/[slug]/quan-ly`):
   - Stats cards: số category, số registration (approved/pending/total), public toggle (`PATCH /tournaments/:tid/visibility`).
   - Quick actions: edit info, manage courts, manage categories, open public.
9. **Category lifecycle UI**: button "Mở đăng ký" → confirm. "Đóng đăng ký" → modal hiển thị số pending nếu > 0 (block). "Mở lại đăng ký" → chỉ hiện khi closed + chưa bốc.
10. **Slug routing**: trang public `/giai/[slug]` map slug → tournament qua `GET /public/tournaments/:slug` (unique index `slug`).
11. **Test data seeder** (`scripts/seed-dev.ts` ở api): tạo 1 admin + 3 user organizer-capable + 1 tournament demo + 3 category để dev nhanh.
12. **Guard / authz tests (supertest + mongodb-memory-server)**:
    - User thường (`athlete`) `POST /tournaments` → 403.
    - User `organizer_capable` tạo được, tự động có `tournamentRoles` role organizer.
    - Non-organizer `GET` tournament private (isPublic=false) → 403.
    - User KHÔNG `PATCH /tournaments/:tid` nếu không phải organizer của tid.

## Success Criteria

- [ ] Admin cấp `organizer_capable` cho user; user đó tạo được tournament.
- [ ] Setup tournament đầy đủ: banner/logo upload (Spaces presign), rules, 2 sponsors với logo, payment QR, 3 sân.
- [ ] Tạo 3 category (đơn nam, đôi nam-nữ, đôi unrestricted) với config đầy đủ.
- [ ] Lifecycle: open → close (test guard pending) → reopen.
- [ ] Code category unique enforce (E11000 → CATEGORY_CODE_DUPLICATE).
- [ ] `mixed_pair + playerCount=1` reject.
- [ ] Slug routing hoạt động.
- [ ] Guard/authz tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race tạo 2 category cùng `code` | Compound unique index `{tournamentId, code}` (E11000 atomic) thay vì read-all-then-write |
| Spaces presign URL lộ / dùng sai | Presign TTL ngắn (vd 5 phút), scope theo key `tournaments/{tid}/...`, content-type constraint; confirm URL về API mới lưu |
| Spaces upload lag UI | Progress indicator + abort controller (XHR/fetch upload PUT) |
| Sponsors array lớn → doc size > 16MB | MVP cap 20 sponsors (xa giới hạn 16MB). Tách collection nếu cần sau |
| Slug collision | Unique index + append `-{shortHash}` nếu E11000 |
| Admin bootstrap mismatch (no organizer_capable user) | Document quy trình: admin grant role trước khi user tạo tournament |

## Security Considerations

- Banner/logo/QR Spaces key namespaced theo `tournaments/{tid}/` để presign scope dễ; CORS bucket config cho phép PUT từ web origin.
- Presign chỉ cấp cho organizer của tournament (guard ở `POST /storage/presign` + validate ownership tid).
- `code` validation regex chặt để tránh injection vào URL.
- Rate limit `POST /tournaments` (1/min/user) chống spam (ThrottlerModule).

## Next Steps

→ Phase 4 (Registration and Payment): VĐV đăng ký được, BTC duyệt + bulk + payment tracking.
