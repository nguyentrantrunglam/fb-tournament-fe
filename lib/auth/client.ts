import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { getClientAuth, getClientFunctions } from '@/lib/firebase/client'
import { landingPath, type GlobalRole } from './roles'
import type { ProfileFormData } from '@/lib/validators/signup'

export async function signInEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getClientAuth(), email, password)
}

export async function signUpEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getClientAuth(), email, password)
}

export async function signInGoogle() {
  return signInWithPopup(getClientAuth(), new GoogleAuthProvider())
}

export async function sendResetEmail(email: string) {
  return sendPasswordResetEmail(getClientAuth(), email)
}

export async function signOut() {
  return fbSignOut(getClientAuth())
}

// Đọc globalRole từ ID token claim → trả route đích sau đăng nhập
export async function landingForUser(user: User): Promise<string> {
  const token = await user.getIdTokenResult()
  return landingPath((token.claims['globalRole'] as GlobalRole) ?? 'user')
}

// Bước 2 signup: CF transaction validate CCCD unique + tạo users/{uid} + private/identity + cccdIndex
export type CompleteProfilePayload = Omit<ProfileFormData, 'phone'> & { phone?: string }

export async function completeProfile(payload: CompleteProfilePayload) {
  const fn = httpsCallable(getClientFunctions(), 'completeProfile')
  return fn(payload)
}
