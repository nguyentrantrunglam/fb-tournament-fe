# firestore-rules

Review và update Firestore Security Rules cho đúng với phase hiện tại.

## Usage

```
/firestore-rules [review|test|update]
```

- `review`: đọc rules hiện tại và phân tích lỗ hổng
- `test`: chạy emulator-based rules test
- `update <phase>`: update rules cho phase cụ thể

## Instructions

### review

1. Đọc `firestore.rules` hiện tại.
2. Đọc `docs/system-architecture.md` §Firestore Security Rules.
3. Cross-check với roles: `admin`, `organizer`, `referee`, `participant`.
4. Kiểm tra:
   - PII fields (`users/{uid}/private/identity`) chỉ owner đọc được không
   - Match scores chỉ referee được viết không
   - Tournament data ai đọc được (public vs private tournaments)
   - Registration list: organizer only
5. Báo cáo: list lỗ hổng tìm thấy (nếu có) + gợi ý fix.

### test

```bash
# Chạy rules test với Firebase emulator
firebase emulators:exec --only firestore "npm run test:rules"
```

Nếu chưa có `test:rules` script, suggest tạo với `@firebase/rules-unit-testing`.

### update <phase>

Dựa vào requirements của phase trong plan, update `firestore.rules` để:
- Mở quyền cần thiết cho phase mới
- Không over-permissive (tối thiểu quyền cần thiết)
- Giữ nguyên rules của phase trước

Sau khi update, chạy `review` để verify không có regression.
