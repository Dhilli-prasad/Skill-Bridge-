import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './apiClient'

afterEach(() => vi.restoreAllMocks())

describe('authenticated API client', () => {
  it('attaches the current access token as a Bearer header', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const request = createApiClient('https://api.example', { getAccessToken: async () => 'access-token', refreshAccessToken: async () => undefined })
    await request('/projects', { requireAuthentication: true })
    expect(fetchMock).toHaveBeenCalledWith('https://api.example/api/projects', expect.objectContaining({ headers: expect.any(Headers) }))
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer access-token')
  })

  it('refreshes once after an expired session response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'expired' } }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const refreshAccessToken = vi.fn().mockResolvedValue('refreshed-token')
    const request = createApiClient('https://api.example', { getAccessToken: async () => 'expired-token', refreshAccessToken })
    await expect(request('/projects', { requireAuthentication: true })).resolves.toEqual({ data: [] })
    expect(refreshAccessToken).toHaveBeenCalledOnce()
    const secondCall = fetchMock.mock.calls[1]
    if (!secondCall) throw new Error('Expected the refreshed request.')
    const secondRequest = secondCall[1]
    if (!secondRequest) throw new Error('Expected request options for the refreshed request.')
    expect((secondRequest.headers as Headers).get('Authorization')).toBe('Bearer refreshed-token')
  })

  it('clears the session when refresh cannot recover an expired token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }))
    const clearSession = vi.fn()
    const request = createApiClient('https://api.example', { getAccessToken: async () => 'expired-token', refreshAccessToken: async () => undefined, clearSession })
    await expect(request('/projects', { requireAuthentication: true })).rejects.toMatchObject({ status: 401 })
    expect(clearSession).toHaveBeenCalledOnce()
  })

  it('surfaces unauthorized and forbidden responses without falling back', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 403 }))
    const request = createApiClient('https://api.example', { getAccessToken: async () => 'token', refreshAccessToken: async () => undefined })
    await expect(request('/private', { requireAuthentication: true })).rejects.toMatchObject({ status: 401 })
    await expect(request('/private', { requireAuthentication: true })).rejects.toMatchObject({ status: 403 })
  })
})
