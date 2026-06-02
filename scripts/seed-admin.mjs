// Seed tài khoản admin hệ thống.
//   - Có FIREBASE_ADMIN_PRIVATE_KEY (.env.local) → chạy trên project thật.
//   - Không có creds → chạy trên EMULATOR (cần `firebase emulators` đang chạy).
// Dùng: node scripts/seed-admin.mjs   (hoặc: yarn seed:admin)
import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// ── Load .env.local (đơn giản) ───────────────────────────────────────────────
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const EMAIL = 'nguyentrantrunglam@gmail.com'
const PASSWORD = '12345678'
const DISPLAY_NAME = 'Nguyễn Trần Trung Lâm'

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tournament-fe-dev'
const hasCreds = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY

if (!hasCreds) {
  // Trỏ admin SDK vào emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= 'localhost:9099'
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080'
  console.log(`▶ Chế độ EMULATOR (project=${projectId}). Đảm bảo emulator đang chạy.`)
} else {
  console.log(`▶ Chế độ PROJECT THẬT (project=${projectId}).`)
}

initializeApp(
  hasCreds
    ? {
        projectId,
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      }
    : { projectId },
)

const auth = getAuth()
const db = getFirestore()

async function run() {
  // 1) Tạo / lấy Auth user
  let user
  try {
    user = await auth.getUserByEmail(EMAIL)
    await auth.updateUser(user.uid, { password: PASSWORD, emailVerified: true, displayName: DISPLAY_NAME })
    console.log(`• Auth user đã tồn tại → cập nhật (uid=${user.uid})`)
  } catch {
    user = await auth.createUser({ email: EMAIL, password: PASSWORD, emailVerified: true, displayName: DISPLAY_NAME })
    console.log(`• Tạo Auth user (uid=${user.uid})`)
  }

  // 2) Custom claim cho role-guard server-side
  await auth.setCustomUserClaims(user.uid, { globalRole: 'admin' })

  // 3) Firestore users/{uid} (public) + private/identity
  const now = FieldValue.serverTimestamp()
  await db.doc(`users/${user.uid}`).set(
    { displayName: DISPLAY_NAME, gender: 'male', dob: '1990-01-01', avatarUrl: null, globalRole: 'admin', createdAt: now },
    { merge: true },
  )
  await db.doc(`users/${user.uid}/private/identity`).set({ email: EMAIL, phone: null, cccd: null }, { merge: true })

  console.log(`✓ Admin sẵn sàng: ${EMAIL} / ${PASSWORD}  (globalRole=admin)`)
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✗ Seed lỗi:', e?.message ?? e)
    process.exit(1)
  })
