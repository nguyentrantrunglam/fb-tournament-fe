// Seed 100 user: test1@fbshop.vn .. test100@fbshop.vn / 12345678
// Họ tên lấy theo các VĐV cầu lông nổi tiếng thế giới.
// Emulator (mặc định) hoặc project thật (nếu có FIREBASE_ADMIN_PRIVATE_KEY). Dùng: yarn seed:users
import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const COUNT = 100
const PASSWORD = '12345678'
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tournament-fe-dev'
const hasCreds = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY

if (!hasCreds) {
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

// VĐV cầu lông nổi tiếng (name + giới tính)
const PLAYERS = [
  ['Lin Dan', 'male'], ['Lee Chong Wei', 'male'], ['Viktor Axelsen', 'male'], ['Kento Momota', 'male'],
  ['Chen Long', 'male'], ['Taufik Hidayat', 'male'], ['Peter Gade', 'male'], ['Lee Yong-dae', 'male'],
  ['Hendra Setiawan', 'male'], ['Mohammad Ahsan', 'male'], ['Anthony Ginting', 'male'], ['Jonatan Christie', 'male'],
  ['Kevin Sanjaya', 'male'], ['Marcus Gideon', 'male'], ['Loh Kean Yew', 'male'], ['Anders Antonsen', 'male'],
  ['Lakshya Sen', 'male'], ['Shi Yuqi', 'male'], ['Lee Zii Jia', 'male'], ['Kidambi Srikanth', 'male'],
  ['Chou Tien-chen', 'male'], ['Ng Ka Long', 'male'], ['Jan Jorgensen', 'male'], ['Tommy Sugiarto', 'male'],
  ['Son Wan-ho', 'male'], ['Zheng Siwei', 'male'], ['Wang Yilyu', 'male'], ['Fu Haifeng', 'male'],
  ['Cai Yun', 'male'], ['Zhang Nan', 'male'], ['Praveen Jordan', 'male'], ['Mathias Boe', 'male'],
  ['Carsten Mogensen', 'male'], ['Vladimir Ivanov', 'male'],
  ['Carolina Marin', 'female'], ['Tai Tzu-ying', 'female'], ['Akane Yamaguchi', 'female'], ['Chen Yufei', 'female'],
  ['Ratchanok Intanon', 'female'], ['P.V. Sindhu', 'female'], ['Saina Nehwal', 'female'], ['Nozomi Okuhara', 'female'],
  ['He Bingjiao', 'female'], ['An Se-young', 'female'], ['Wang Yihan', 'female'], ['Li Xuerui', 'female'],
  ['Zhang Ning', 'female'], ['Wang Shixian', 'female'], ['Sung Ji-hyun', 'female'], ['Busanan Ongbamrung', 'female'],
  ['Pornpawee Chochuwong', 'female'], ['Mia Blichfeldt', 'female'], ['Michelle Li', 'female'], ['Beiwen Zhang', 'female'],
  ['Gregoria Tunjung', 'female'], ['Supanida Katethong', 'female'], ['Greysia Polii', 'female'], ['Apriyani Rahayu', 'female'],
  ['Misaki Matsutomo', 'female'], ['Ayaka Takahashi', 'female'], ['Huang Yaqiong', 'female'], ['Chen Qingchen', 'female'],
  ['Jia Yifan', 'female'], ['Zhao Yunlei', 'female'], ['Yui Hashimoto', 'female'], ['Pusarla Sindhu', 'female'],
]

const pad = (n, len) => String(n).padStart(len, '0')
const auth = getAuth()
const db = getFirestore()

async function seedOne(i) {
  const email = `test${i}@fbshop.vn`
  const [baseName, gender] = PLAYERS[(i - 1) % PLAYERS.length]
  const cycle = Math.floor((i - 1) / PLAYERS.length)
  const displayName = cycle > 0 ? `${baseName} ${cycle + 1}` : baseName
  const cccd = String(100000000000 + i) // 12 số, unique
  const dob = `${1985 + (i % 15)}-${pad(1 + (i % 12), 2)}-${pad(1 + (i % 28), 2)}`
  const phone = `09${pad(10000000 + i, 8).slice(-8)}`

  let user
  try {
    user = await auth.getUserByEmail(email)
    await auth.updateUser(user.uid, { password: PASSWORD, emailVerified: true, displayName })
  } catch {
    user = await auth.createUser({ email, password: PASSWORD, emailVerified: true, displayName })
  }

  const now = FieldValue.serverTimestamp()
  await db.doc(`users/${user.uid}`).set(
    { displayName, gender, dob, avatarUrl: null, globalRole: 'user', createdAt: now },
    { merge: true },
  )
  await db.doc(`users/${user.uid}/private/identity`).set({ cccd, phone, email }, { merge: true })
  await db.doc(`cccdIndex/${cccd}`).set({ userId: user.uid, createdAt: now }, { merge: true })
  return displayName
}

async function run() {
  let done = 0
  const CONCURRENCY = 10
  for (let start = 1; start <= COUNT; start += CONCURRENCY) {
    const batch = []
    for (let i = start; i < start + CONCURRENCY && i <= COUNT; i++) batch.push(seedOne(i))
    await Promise.all(batch)
    done += batch.length
    console.log(`  …${done}/${COUNT}`)
  }
  console.log(`✓ Đã seed ${COUNT} user: test1..test${COUNT}@fbshop.vn / ${PASSWORD}`)
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✗ Seed lỗi:', e?.message ?? e)
    process.exit(1)
  })
