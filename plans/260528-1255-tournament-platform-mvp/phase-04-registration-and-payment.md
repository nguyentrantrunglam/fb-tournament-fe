---
phase: 4
title: "Registration and Payment"
status: pending
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
- Payment tracking: `markPaid` / `unmarkPaid` với audit.
- Team photo upload (override default composite avatar).
- `setRegistrationSeed` ở phase "Config đội" (sau `closed`, trước bốc thăm).
- VĐV rút (`withdraw`): xử lý cascade sẽ ở P6, ở phase này chỉ set status.

**Non-functional:**
- Bulk submit 20 rows: response < 5s.
- Slot counter race-safe.
- Team photo upload < 3s/file (~500KB image).

## Architecture

**Files:**
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
├── team-photo-uploader.tsx
└── seed-input.tsx                             # number input + clear button

functions/src/
├── handlers/registration/
│   ├── create-registration.ts                 # self: full validation pipeline
│   ├── organizer-create-registration.ts       # single: auto approved
│   ├── organizer-bulk-create.ts               # batch with partial commit
│   ├── approve-registration.ts
│   ├── reject-registration.ts
│   ├── withdraw.ts                            # set status, defer cascade to P6
│   ├── mark-paid.ts
│   ├── unmark-paid.ts
│   ├── set-registration-seed.ts
│   └── upload-team-photo.ts
└── domain/validation/
    ├── gender-requirement.ts                  # matrix logic
    └── partner-eligibility.ts                 # not self, exists, etc.

lib/queries/
├── use-registrations.ts                       # filter by status
└── use-user-search.ts                         # search by name/email/cccd (admin/organizer scope)
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `firestore.rules`: thêm rule cho `registrations/*` (chính chủ create, organizer + admin update)
  - `lib/validators/`: thêm registration schema
- Delete: none

## Implementation Steps

### Validation pipeline (shared)

1. **`domain/validation/gender-requirement.ts`** (pure function):
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
       if (primaryUser.uid === partnerUser.uid) return reject("Không tự ghép đôi")
       switch (category.genderRequirement) {
         case 'men_only': both male
         case 'women_only': both female
         case 'mixed_pair': one of each
         case 'unrestricted': ok
       }
     }
   }
   ```
2. **`domain/validation/partner-eligibility.ts`**:
   - Partner user phải tồn tại trong system.
   - Không tự ghép.
   - (P5+) Partner đã đăng ký category khác cùng giải → cảnh báo nhẹ, không block.

### CF endpoints

3. **`create-registration` (self)**: 5 điều kiện theo system-arch §8.1 + gender validate. Default `status=pending`, `paymentStatus=unpaid`, `createdMode=self`, `createdByUid=userId`. Snapshot `feeSnapshot`.
4. **`organizer-create-registration`**: same validation + organizer-guard + auto-approved.
5. **`organizer-bulk-create`**:
   - Input: `{ rows: Array<{categoryId, userId, partnerUserId?}> }`.
   - For loop, mỗi row try/catch:
     - Read user(s) (cache trong CF execution).
     - Read category (cache).
     - Validate gender + duplicate (đã đăng ký category đó chưa).
     - Slot check với **running counter** (count from current DB + previous successful rows in this batch).
     - Tạo registration `status=approved`.
   - Return `{ success: [{rowIndex, registrationId}], errors: [{rowIndex, code, message}] }`.
   - Audit log batch event.
6. **`approve-registration`** / **`reject-registration`**: organizer-guard. State transitions chỉ từ `pending`.
7. **`withdraw`**: chính chủ hoặc organizer. Set status `withdrawn`. **CASCADE LOGIC chuyển P6** (chỉ stub status update ở đây).
8. **`mark-paid` / `unmark-paid`**: organizer-guard. Set `paymentStatus`, `paidAt`, `paidMarkByUid`.
9. **`set-registration-seed`**: organizer-guard + `category.registrationStatus === 'closed'` + chưa có bracket active. KHÔNG validate uniqueness (chỉ check khi drawBracket).
10. **`upload-team-photo`**:
    - Client upload trực tiếp lên Storage path `tournaments/{tid}/teams/{registrationId}.{ext}` qua Storage rules cho phép organizer write.
    - Sau khi upload, call CF `confirm-team-photo` để lưu `teamPhotoUrl` vào registration doc (đảm bảo URL hợp lệ).

### UI

11. **Self register form**:
    - Hidden field auto-set `userId = currentUser.uid`.
    - Nếu `playerCount === 2`: hiện partner picker.
    - Partner picker dùng `useUserSearch` với filter theo gender (men_only → male users; mixed_pair → opposite gender).
    - Submit → toast success "Đăng ký đang chờ duyệt".
12. **Organizer single form**: chọn category trước, sau đó pick VĐV(1) + partner. Validate same as self.
13. **Bulk form**:
    - Table với cột: Category, VĐV chính (search), Partner (search, hiện nếu đôi). Add row / remove row buttons.
    - Submit → loading → modal hiển thị result table 2 cột (success/error).
    - Error row có nút "Sửa lại dòng này" → mở row trong form mới.
14. **Registration list (organizer)**: filter tabs `pending | approved | rejected | withdrawn`, badge unpaid/paid, mass-action checkbox (approve/reject nhiều ở 1 click — KISS dùng vòng lặp CF calls).
15. **Config đội page**: list tất cả registration `approved` của category, mỗi card cho phép set/clear seed + upload team photo. Drag-drop seed (P5+, MVP dùng number input).

### Rules update

16. **Firestore rules**:
    ```
    match /tournaments/{tid}/categories/{cid}/registrations/{rid} {
      allow read: if isParticipantOrOrganizer(tid, rid) ||
                     (isRosterPublic(tid, cid) && (isSignedIn() || true));
      allow create: if isSignedIn() && request.resource.data.userId == uid();
      allow update, delete: if false;  // CF only
    }
    ```
    `isRosterPublic` helper check `category.registrationStatus == 'closed' && tournament.isPublic == true`.

### Tests

17. **Validation matrix tests**: 4 genderRequirement × 2 playerCount × các combo gender → ~16 test cases pure function.
18. **CF integration tests** (emulator):
    - Self register success.
    - Duplicate registration cùng category → reject.
    - maxTeams = 2, đăng ký 3 → cái thứ 3 reject "Hết slot".
    - Bulk 5 rows: 3 ok, 2 fail → partial commit verified.
    - Mark paid + unmark paid → audit log đúng.
19. **Rules tests**: chính chủ thấy registration của mình lúc pending, public KHÔNG thấy. Sau khi `closed`, public thấy.

## Success Criteria

- [ ] Self register flow 4 trường hợp gender requirement: men_only / women_only / mixed_pair / unrestricted — UI filter + server validate đều đúng.
- [ ] Duplicate registration cùng category → reject.
- [ ] maxTeams enforce (cả self + bulk).
- [ ] Bulk 20 rows: 15 success + 5 error → response < 5s, hiển thị table rõ ràng.
- [ ] Mark paid → audit log + UI badge cập nhật realtime.
- [ ] Team photo upload + override hiển thị đúng (composite default trước, ảnh sau).
- [ ] Set seed: nhiều registration cùng seed=1 cho phép (chỉ validate khi drawBracket).
- [ ] Withdraw set status; cascade defer P6.
- [ ] Rules tests + validation matrix tests pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Race condition slot count khi 2 user submit đồng thời | CF transaction read+write trong cùng tx; bulk dùng running counter trong loop |
| User search lộ email/cccd | Search server-side, return chỉ `{uid, displayName, gender, avatar}` |
| Team photo file lớn → cost Storage + bandwidth | Client compress image ≤ 1MB trước upload (browser canvas) |
| Bulk 100+ rows timeout CF | MVP cap 50 rows/batch, UI báo nếu vượt. Chia batch tự động ở client (P5+). |
| Partner không có tài khoản | UI hiển thị "Không tìm thấy. Mời họ tạo account trước." Link share signup. |
| Seed input invalid (negative, string) | Zod schema integer ≥ 1, max ≤ maxTeams |

## Security Considerations

- User search: rate limit (10/min/user), return minimal fields.
- Storage rule: chỉ organizer của tournament được write `tournaments/{tid}/teams/*`.
- Bulk register: rate limit (5 batches/min/user) chống abuse.
- Payment audit log immutable.
- `setRegistrationSeed` guard chặt: organizer + closed + no active bracket.

## Next Steps

→ Phase 5 (Bracket Generation): bốc thăm single-elim với crossover seeding, mode auto-detect.
