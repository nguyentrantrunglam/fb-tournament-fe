# emulator

Khởi động Firebase Emulator Suite cho local development.

## Usage

```
/emulator [start|stop|reset]
```

- `start` (mặc định): khởi động emulator + Next.js dev server
- `stop`: dừng tất cả
- `reset`: xóa dữ liệu emulator và restart

## Instructions

Dựa vào `$ARGUMENTS`:

### start (mặc định nếu không có args)

1. Kiểm tra `firebase.json` tồn tại. Nếu chưa có, báo "Chạy `/implement-phase 1` trước".

2. Kiểm tra port xung đột:
   ```bash
   lsof -i :4000,8080,9099,9199,5001,9000 2>/dev/null
   ```

3. Khởi động Firebase emulator ở background:
   ```bash
   firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
   ```

4. Đợi emulator UI sẵn sàng (port 4000), sau đó khởi động Next.js:
   ```bash
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev
   ```

5. Báo địa chỉ:
   - App: http://localhost:3000
   - Emulator UI: http://localhost:4000
   - Firestore: http://localhost:8080
   - Auth: http://localhost:9099
   - Functions: http://localhost:5001

### stop

```bash
pkill -f "firebase emulators" && pkill -f "next dev"
```

### reset

Dừng emulator, xóa `./emulator-data/`, sau đó restart.

Nếu project chưa có `emulator-data/`, bỏ qua bước xóa.
