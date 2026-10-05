import { createDpopProof } from './device-key'
import { secureSession } from './secure-session'

/**
 * Cliente HTTP móvil. Igual que la web salvo que no hay cookies:
 * el refresh token (en SecureStore) viaja en `X-Refresh-Token`, siempre con prueba DPoP.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

/**
 * Por qué terminó la sesión, para explicarlo en la pantalla de acceso.
 * `closed`: la cerraron desde otro dispositivo y lo hemos sabido por socket.
 */
export type SessionEndReason = 'expired' | 'revoked' | 'closed'

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
const expiredListeners = new Set<(reason: SessionEndReason) => void>()

export const session = {
  setAccessToken: (token: string | null) => {
    accessToken = token
  },
  /** El socket necesita el token para el handshake; nunca sale de memoria. */
  getAccessToken: () => accessToken,
  /** Guarda la sesión emitida por login/refresh. */
  async store(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken
    await secureSession.setRefreshToken(tokens.refreshToken)
  },
  async clear() {
    accessToken = null
    await secureSession.clearRefreshToken()
  },
  onExpired(listener: (reason: SessionEndReason) => void) {
    expiredListeners.add(listener)
    return () => expiredListeners.delete(listener)
  },
}

async function parseError(res: Response) {
  const payload = (await res.json().catch(() => null)) as {
    error?: { code: string; message: string; details?: unknown }
  } | null
  return new ApiError(
    res.status,
    payload?.error?.code ?? 'HTTP_ERROR',
    payload?.error?.message ?? 'Error',
    payload?.error?.details,
  )
}

/** Renueva el access token con el refresh de SecureStore. false si no hay sesión válida. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await secureSession.getRefreshToken()
      if (!refreshToken) return false
      const url = `${API_BASE}/auth/refresh`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Refresh-Token': refreshToken, DPoP: await createDpopProof('POST', url) },
      })
      if (!res.ok) {
        const error = await parseError(res)
        // Reuso detectado o dispositivo revocado: se borra la sesión local.
        if (res.status === 401) await session.clear()
        if (error.code === 'SESSION_REVOKED') expiredListeners.forEach((l) => l('revoked'))
        return false
      }
      await session.store((await res.json()) as { accessToken: string; refreshToken: string })
      return true
    } catch {
      return false
    } finally {
      setTimeout(() => (refreshing = null), 0)
    }
  })()
  return refreshing
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
  /** Envía prueba DPoP aunque no haya token (login). */
  dpop?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { body, auth = true, dpop = false, headers, ...init } = options
  const url = `${API_BASE}${path}`
  const method = (init.method ?? 'GET').toUpperCase()
  const finalHeaders = new Headers(headers)
  if (body !== undefined) finalHeaders.set('Content-Type', 'application/json')
  if (auth && accessToken) {
    finalHeaders.set('Authorization', `Bearer ${accessToken}`)
    finalHeaders.set('DPoP', await createDpopProof(method, url, accessToken))
  } else if (dpop) {
    finalHeaders.set('DPoP', await createDpopProof(method, url))
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401 && auth && !retried) {
    if (await refreshSession()) return apiRequest<T>(path, options, true)
    expiredListeners.forEach((listener) => listener('expired'))
  }

  if (!res.ok) throw await parseError(res)
  return (res.status === 204 ? undefined : await res.json()) as T
}

/**
 * Cabeceras firmadas para una descarga. El PDF no se baja con `fetch`: lo
 * descarga expo-file-system directo a disco, y necesita las cabeceras hechas.
 * Renueva el access token si hace falta, porque dura 10 minutos.
 */
export async function signedHeaders(path: string, method = 'GET'): Promise<Record<string, string>> {
  if (!accessToken) await refreshSession()
  if (!accessToken) throw new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar')
  const url = `${API_BASE}${path}`
  return {
    Authorization: `Bearer ${accessToken}`,
    DPoP: await createDpopProof(method, url, accessToken),
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
