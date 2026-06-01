import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'

let adminApp: App
export function getAdminApp(): App {
  if (!adminApp) {
    adminApp = getApps().length === 0
      ? initializeApp({ credential: cert({
          projectId:   process.env['FIREBASE_ADMIN_PROJECT_ID']!,
          clientEmail: process.env['FIREBASE_ADMIN_CLIENT_EMAIL']!,
          privateKey:  process.env['FIREBASE_ADMIN_PRIVATE_KEY']!.replace(/\\n/g, '\n'),
        }) })
      : getApps()[0]!
  }
  return adminApp
}
