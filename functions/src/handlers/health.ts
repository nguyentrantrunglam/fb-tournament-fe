import { onCall } from 'firebase-functions/v2/https'
export const health = onCall({ region: 'asia-southeast1' }, () => ({ ok: true, ts: Date.now() }))
