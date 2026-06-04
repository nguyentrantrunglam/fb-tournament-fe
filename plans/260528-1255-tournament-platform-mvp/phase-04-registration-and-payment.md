---
phase: 4
title: "Registration and Payment"
status: done
priority: P1
effort: "5-6d"
dependencies: [3]
---

# Phase 4: Registration and Payment

## Overview

Build 3 cách tạo registration (self / organizer single / bulk), gender validation matrix theo `genderRequirement`, payment tracking, team photo upload, set seed. Output: 1 category có thể chuyển từ `open` → `closed` với danh sách đội đầy đủ + ảnh + seed sẵn sàng bốc thăm.

## Requirements

**Functional:**
- VĐV tự đăng ký 1 hoặc nhiều category trong 1 giải.
- Đôi: chọn partner từ user search (filter theo gender requirement).
- Mixed doubles validate gender (1 nam + 1 nữ).
- Đôi unrestricted: không filter, không validate gender.
- `feeSnapshot` capture lúc tạo registration.
- BTC duyệt/từ chối thủ công (single).
- BTC đăng ký hộ (single) — auto `approved`.
- **Bulk register**: form multi-row, validate từng dòng, partial commit, return success/error list.
- Payment tracking: mark-paid / unmark-paid với audit.
- Team photo upload (override default composite avatar).
- Set seed ở phase "Config đội" (sau `closed`, trước bốc thăm).
- VĐV rút (`withdraw`): xử lý cascade sẽ ở P6, ở phase này chỉ set status.

**Non-functional:**
- Bulk submit 20 rows: response < 5s.
- Slot counter race-safe (Mongo transaction).
- Team photo upload < 3s/file (~500KB image).

## Architecture

**`badminton-web` files:**
```
app/
├── (app)/giai/[slug]/
│   ├── dang-ky/page.tsx                       # self register form
│   ├── quan-ly/dang-ky/
│   │   ├── page.tsx                           # BTC view list registrations (filter: status, payment)
│   │   ├── tao-moi/page.tsx                   # organizer single create
│   │   ├── tao-hang-loat/page.tsx             # bulk register form
│   │   └── [registrationId]/page.tsx          # detail + approve/reject/mark-paid + team photo
│   └── quan-ly/hang-muc/[categoryId]/cau-hinh-doi/page.tsx  # config đội: seed + team photo

components/registration/
├── self-register-form.tsx                     # validate per genderRequirement client
├── partner-picker.tsx                         # search + filter theo gender
├── organizer-single-form.tsx
├── organizer-bulk-form.tsx                    # multi-row, add/remove row, submit
├── bulk-result-table.tsx                      # show success/error per row
├── payment-status-toggle.tsx
├── team-photo-uploader.tsx                    # presign PUT Spaces + confirm
└── seed-input.tsx                             # number input + clear button

lib/api/
├── registrations.ts                           # filter by status (TanStack Query)
└── user-search.ts                             # search by name/email/nationalId (admin/organizer scope)
```

**`badminton-api` module `registrations/` (NestJS):**
```
src/modules/registrations/
├── registrations.controller.ts
│   # POST /categories/:cid/registrations            (self, authenticated)
│   # POST /categories/:cid/registrations/organizer  (single, organizer)
│   # POST /tournaments/:tid/registrations/bulk       (bulk, organizer)
│   # POST /registrations/:rid/{approve|reject}       (organizer)
│   # POST /registrations/:rid/withdraw               (owner|organizer)
│   # POST /registrations/:rid/{mark-paid|unmark-paid}(organizer)
│   # PATCH /registrations/:rid/seed                  (organizer)
│   # POST /storage/presign + PATCH /registrations/:rid/team-photo (organizer)
├── registrations.service.ts                   # slot counter (Mongo transaction), bulk loop
src/domain/validation/
├── gender-requirement.ts                      # matrix logic (PURE — không đổi)
└── partner-eligibility.ts                     # not self, exists, etc.
```

## Related Code Files

- Create: tất cả ở Architecture (web + api)
- Modify:
  - serialize interceptor: `registrations` sensitive fields (`paymentStatus`, `feeSnapshot`, `paidMarkByUserId`) chỉ trả cho organizer/owner/admin (không public dù roster closed)
  - `lib/validators/`: thêm registration schema
- Delete: none

## Implementation Steps

### Validation pipeline (shared, domain pure — không import nestjs/mongoose)

1. **`domain/validation/gender-requirement.ts`** (pure function — logic giữ NGUYÊN):
   ```ts
   function validate(category, primaryUser, partnerUser?): { ok: boolean, error?: string } {
     if (category.playerCount === 1) {
       if (partnerUser) return reject("Đơn không có partner")
       switch (category.genderRequirement) {
         case 'men_only': return primaryUser.gender === 'male' ? ok : reject(...)
         case 'women_only': return primaryUser.gender === 'female' ? ok : reject(...)
         case 'unrestricted': return ok
         case 'mixed_pair': throw "INVALID_CATEGORY_CONFIG"
       }
     }
     if (category.playerCount === 2) {
       if (!partnerUser) return reject("Đôi cần partner")
       if (primaryUser.userId === partnerUser.userId) return reject("Không tự ghép đôi")
       switch (category.genderRequirement) {
         case 'men_only': both male
         case 'women_only': both female
         case 'mixed_pair': one of each
         case 'unrestricted': ok
       }
     }
   }
   ```
   (Hàm thao tác trên plain object — không phụ thuộc storage; `uid` → `userId`.)
2. **`domain/validation/partner-eligibility.ts`**:
   - Partner user phải tồn tại trong system.
   - Không tự ghép.
   - (P5+) Partner đã đăng ký category khác cùng giải → cảnh báo nhẹ, không block.

### API endpoints (registrations.service)

3. **`POST /categories/:cid/registrations` (self)**: `AuthenticatedGuard`. 5 điều kiện theo system-arch §8.1 + gender validate. Default `status=pending`, `paymentStatus=unpaid`, `createdMode=self`, `createdByUserId=userId`. Snapshot `feeSnapshot`. Slot check (`count status IN [pending,approved] < maxTeams`) đọc + ghi trong **cùng Mongo session transaction** chống race.
4. **`POST /categories/:cid/registrations/organizer` (single)**: same validation + `TournamentRoleGuard(organizer)` + auto `approved` (`approvedByUserId`, `createdMode=organizer_single`).
5. **`POST /tournaments/:tid/registrations/bulk` (bulk)** (`TournamentRoleGuard(organizer)`):
   - Input: `{ rows: Array<{categoryId, userId, partnerUserId?}> }` (cap 50 rows).
   - For loop, mỗi row try/catch độc lập:
     - Resolve user(s) tồn tại (cache trong request).
     - Read category → `registrationStatus == 'open'`.
     - Validate gender + duplicate (đã có reg active trong category chưa).
     - Slot check với **running counter** (DB count + previous successful rows trong batch).
     - Insert registration `status=approved`, `createdMode=organizer_bulk`, `createdByUserId=organizer`, `approvedByUserId=organizer`.
   - **Partial commit:** mỗi row thành công vẫn lưu dù row khác lỗi → insert per-row (KHÔNG bao 1 transaction tổng cho cả batch); slot race chấp nhận running-counter.
   - Return `{ success: [{rowIndex, registrationId}], errors: [{rowIndex, code, message}] }`. Audit log batch event.
6. **`POST /registrations/:rid/{approve|reject}`** (`TournamentRoleGuard(organizer)`): state transitions chỉ từ `pending`.
7. **`POST /registrations/:rid/withdraw`** (`AuthenticatedGuard` owner | organizer): set status `withdrawn`. **CASCADE LOGIC chuyển P6** (chỉ stub status update ở đây).
8. **`POST /registrations/:rid/{mark-paid|unmark-paid}`** (`TournamentRoleGuard(organizer)`): set `paymentStatus`, `paidAt`, `paidMarkByUserId`. KHÔNG ràng buộc approve flow.
9. **`PATCH /registrations/:rid/seed`** (`TournamentRoleGuard(organizer)` + `category.registrationStatus === 'closed'` + chưa có bracket active): set/clear seed. KHÔNG validate uniqueness (chỉ check khi draw bracket).
10. **Team photo upload**:
    - `POST /storage/presign` → client PUT ảnh trực tiếp lên Spaces key `tournaments/{tid}/teams/{registrationId}.{ext}`.
    - `PATCH /registrations/:rid/team-photo { url }` (`TournamentRoleGuard(organizer)`) confirm + lưu `teamPhotoUrl` vào registration (validate URL thuộc bucket/prefix hợp lệ).

### UI

11. **Self register form**:
    - Hidden field auto-set `userId = currentUser.userId`.
    - Nếu `playerCount === 2`: hiện partner picker.
    - Partner picker dùng `useUserSearch` với filter theo gender (men_only → male; mixed_pair → opposite gender).
    - Submit → toast "Đăng ký đang chờ duyệt".
12. **Organizer single form**: chọn category trước, sau đó pick VĐV(1) + partner. Validate same as self.
13. **Bulk form**:
    - Table cột: Category, VĐV chính (search), Partner (search, hiện nếu đôi). Add/remove row.
    - Submit → loading → modal result table 2 cột (success/error).
    - Error row có nút "Sửa lại dòng này".
14. **Registration list (organizer)**: filter tabs `pending | approved | rejected | withdrawn`, badge unpaid/paid (cập nhật realtime qua Socket.IO `registration:updated`), mass-action checkbox (KISS dùng vòng lặp API calls).
15. **Config đội page**: list registration `approved` của category, mỗi card set/clear seed + upload team photo. Drag-drop seed (P5+, MVP dùng number input).

### Tests

16. **Validation matrix tests (Jest unit, domain pure)**: 4 genderRequirement × 2 playerCount × các combo gender → ~16 test cases.
17. **e2e tests (supertest + mongodb-memory-server)**:
    - Self register success.
    - Duplicate registration cùng category → reject.
    - maxTeams = 2, đăng ký 3 → cái thứ 3 reject "Hết slot" (transaction slot check).
    - Bulk 5 rows: 3 ok, 2 fail → partial commit verified.
    - Mark paid + unmark paid → audit log đúng.
18. **Guard/authz tests (supertest)**: chính chủ thấy registration của mình lúc pending; public KHÔNG thấy (serializer); sau `closed` + isPublic → public thấy roster (qua `GET /public/...`) nhưng KHÔNG thấy paymentStatus/feeSnapshot.

## Success Criteria

- [ ] Self register flow 4 trường hợp gender requirement: men_only / women_only / mixed_pair / unrestricted — UI filter + server validate đều đúng.
- [ ] Duplicate registration cùng category → reject.
- [ ] maxTeams enforce (cả self + bulk).
- [ ] Bulk 20 rows: 15 success + 5 error → response < 5s, hiển thị table rõ ràng.
- [ ] Mark paid → audit log + UI badge cập nhật realtime (Socket.IO).
- [ ] Team photo upload (Spaces presign) + override hiển thị đúng.
- [ ] Set seed: nhiều registration cùng seed=1 cho phép (chỉ validate khi draw bracket).
- [ ] Withdraw set status; cascade defer P6.
- [ ] Guard/authz tests + validation matrix tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race slot count khi 2 user submit đồng thời | Self: Mongo session transaction read+write slot trong cùng tx; bulk: running counter trong loop |
| User search lộ email/nationalId | Search server-side, return chỉ `{userId, displayName, gender, avatar}` (serializer loại PII) |
| Team photo file lớn → cost Spaces + bandwidth | Client compress image ≤ 1MB trước upload (browser canvas); presign content-length constraint |
| Bulk 100+ rows timeout | MVP cap 50 rows/batch, UI báo nếu vượt. Chia batch tự động ở client (P5+) |
| Partner không có tài khoản | UI "Không tìm thấy. Mời họ tạo account trước." Link share register |
| Seed input invalid | Zod schema integer ≥ 1, max ≤ maxTeams |

## Security Considerations

- User search: rate limit (10/min/user), return minimal fields (serializer loại nationalId/phone/email).
- Spaces presign: chỉ organizer của tournament được cấp; key scope `tournaments/{tid}/teams/*`; content-type + size constraint; confirm URL về API mới lưu.
- Bulk register: rate limit (5 batches/min/user) chống abuse (ThrottlerModule).
- Payment audit log immutable (service không update/delete `auditLogs`).
- `PATCH /registrations/:rid/seed` guard chặt: organizer + closed + no active bracket.

## Next Steps

→ Phase 5 (Bracket Generation): bốc thăm single-elim với crossover seeding, mode auto-detect.
