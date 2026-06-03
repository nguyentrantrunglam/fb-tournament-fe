/**
 * REST client for badminton-api (NestJS). All requests send the session cookie
 * (`credentials: 'include'`) — connect.sid is shared with Socket.IO. Errors surface
 * the api's `{ statusCode, code, message }` shape via ApiError.
 *
 * Strangler note: this is the new data layer. Firebase code stays until each feature
 * is migrated to these endpoints in its phase.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })

  const text = await res.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    // Non-JSON (e.g. proxy 502 HTML, gateway timeout) — surface as ApiError, not SyntaxError.
    throw new ApiError(res.status, 'BAD_RESPONSE', res.statusText || 'Phản hồi không hợp lệ')
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body?.code as string) ?? 'UNKNOWN',
      (body?.message as string) ?? res.statusText,
    )
  }
  return body as T
}

// Build init with `body` present only when there's data (exactOptionalPropertyTypes-safe).
const withBody = (method: string, data?: unknown): RequestInit =>
  data != null ? { method, body: JSON.stringify(data) } : { method }

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data?: unknown) => apiFetch<T>(path, withBody('POST', data)),
  patch: <T>(path: string, data?: unknown) => apiFetch<T>(path, withBody('PATCH', data)),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
