import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { getClientApp } from './client'

let connected = false
export function connectEmulators() {
  if (connected) return
  connected = true
  const app = getClientApp()
  connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080)
  connectFunctionsEmulator(getFunctions(app), 'localhost', 5001)
  connectStorageEmulator(getStorage(app), 'localhost', 9199)
}
