export interface ApiRequestOptions extends RequestInit {
  accessToken?: string
  requireAuthentication?: boolean
}

/**
 * Authentication adapter boundary for a Cognito-capable auth provider.
 * The provider owns refresh-token handling; this client keeps only access
 * tokens in memory and never writes credentials to browser storage.
 */
export interface ApiAuthSession {
  getAccessToken: () => string | undefined | Promise<string | undefined>
  refreshAccessToken: () => Promise<string | undefined>
  clearSession?: () => void
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
let inMemoryAccessToken: string | undefined
let authSession: ApiAuthSession | undefined

export class ApiClientError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

/** Set the current Cognito access token in memory; never persist it in browser storage. */
export function setApiAccessToken(accessToken: string) {
  inMemoryAccessToken = accessToken.trim() || undefined
}

export function clearApiAccessToken() {
  inMemoryAccessToken = undefined
}

export function configureApiAuthSession(session: ApiAuthSession | undefined) {
  authSession = session
  clearApiAccessToken()
}

export function createApiClient(baseUrl: string, session?: ApiAuthSession) {
  let clientAccessToken: string | undefined

  return async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { accessToken, requireAuthentication = false, ...requestInit } = options
    let token = accessToken ?? clientAccessToken
    if (!token && session) token = await session.getAccessToken()
    if (requireAuthentication && !token) {
      if (session) {
        session.clearSession?.()
        throw new ApiClientError(401, 'Your session has expired. Please sign in again.')
      }
      throw new ApiClientError(401, 'Sign in is required for AWS API mode.')
    }
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const apiPath = normalizedPath === '/api' || normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`
    const requestUrl = `${normalizedBaseUrl}${apiPath}`
    const send = async (requestToken?: string) => {
      const headers = new Headers(requestInit.headers)
      headers.set('Accept', 'application/json')
      if (requestInit.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      if (requestToken) headers.set('Authorization', `Bearer ${requestToken}`)
      return fetch(requestUrl, { ...requestInit, headers })
    }
    let response = await send(token)
    if (response.status === 401 && requireAuthentication && session) {
      const refreshedToken = await session.refreshAccessToken()
      if (refreshedToken) {
        clientAccessToken = refreshedToken
        response = await send(refreshedToken)
      } else {
        clientAccessToken = undefined
        session.clearSession?.()
      }
    }
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string'
        ? payload.error.message
        : response.status === 401 ? 'Your session has expired. Please sign in again.'
          : response.status === 403 ? 'You are not authorized to perform this action.'
            : 'SkillBridge API request failed.'
      throw new ApiClientError(response.status, message)
    }
    return payload as T
  }
}

/**
 * Small fetch wrapper for the future Cognito/API Gateway integration.
 * Existing localStorage services remain the source of truth until migration.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiClientError(0, 'SkillBridge API is not configured.')
  const client = createApiClient(API_BASE_URL, authSession)
  if (inMemoryAccessToken) return client<T>(path, { ...options, accessToken: options.accessToken ?? inMemoryAccessToken })
  return client<T>(path, options)
}
