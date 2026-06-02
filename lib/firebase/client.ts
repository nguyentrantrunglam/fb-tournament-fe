import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions'
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'

const FUNCTIONS_REGION = 'asia-southeast1'

const firebaseConfig = {
  apiKey:            process.env['NEXT_PUBLIC_FIREBASE_API_KEY']!,
  authDomain:        process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']!,
  projectId:         process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID']!,
  storageBucket:     process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']!,
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']!,
  appId:             process.env['NEXT_PUBLIC_FIREBASE_APP_ID']!,
}

const useEmulator = process.env['NEXT_PUBLIC_USE_EMULATOR'] === 'true'

let app: FirebaseApp | undefined
let emulatorsConnected = false

export function getClientApp(): FirebaseApp {
  if (!app) app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!
  return app
}

export function getClientAuth(): Auth {
  ensureEmulators()
  return getAuth(getClientApp())
}

export function getClientDb(): Firestore {
  ensureEmulators()
  return getFirestore(getClientApp())
}

export function getClientFunctions(): Functions {
  ensureEmulators()
  return getFunctions(getClientApp(), FUNCTIONS_REGION)
}

export function getClientStorage(): FirebaseStorage {
  ensureEmulators()
  return getStorage(getClientApp())
}

// Kết nối emulator 1 lần (dev) trước khi dùng auth/db/functions/storage.
function ensureEmulators() {
  if (!useEmulator || emulatorsConnected) return
  emulatorsConnected = true
  const a = getClientApp()
  connectAuthEmulator(getAuth(a), 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(getFirestore(a), 'localhost', 8080)
  connectFunctionsEmulator(getFunctions(a, FUNCTIONS_REGION), 'localhost', 5001)
  connectStorageEmulator(getStorage(a), 'localhost', 9199)
}
