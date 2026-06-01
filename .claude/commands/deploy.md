# deploy

Deploy lên môi trường staging (Firebase + Vercel preview).

## Usage

```
/deploy [staging|prod] [--functions-only|--rules-only|--fe-only]
```

- `staging` (mặc định): deploy Firebase staging project + Vercel preview branch
- `prod`: deploy production — **yêu cầu confirm tường minh**

## Instructions

### Xác định scope từ `$ARGUMENTS`

Parse flags:
- `--functions-only`: chỉ deploy Cloud Functions
- `--rules-only`: chỉ deploy Firestore + Storage rules
- `--fe-only`: chỉ deploy Next.js lên Vercel

### Pre-deploy checks

1. Chạy type check:
   ```bash
   npm run type-check 2>/dev/null || npx tsc --noEmit
   ```

2. Chạy lint:
   ```bash
   npm run lint
   ```

3. Build functions:
   ```bash
   cd functions && npm run build
   ```

4. Nếu có lỗi, dừng và báo lỗi — không deploy code broken.

### Deploy staging (mặc định)

```bash
# Firebase rules + functions
firebase deploy --project=staging

# Vercel preview (tự động qua git push, hoặc manual)
vercel --env=staging
```

### Deploy prod

Trước khi deploy prod:
1. Hỏi confirm: "Bạn có chắc muốn deploy lên PRODUCTION không? (yes/no)"
2. Chỉ tiếp tục khi user trả lời "yes" tường minh.
3. Chạy full test suite trước:
   ```bash
   npm run test
   ```

### Post-deploy

Liệt kê URLs đã deploy:
- Vercel preview URL
- Firebase Hosting URL (nếu có)
- Firebase Console > Functions để verify CF deployed

Nếu deploy thất bại, in error log và suggest fix.
