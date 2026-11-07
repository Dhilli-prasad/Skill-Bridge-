import { describe, expect, it } from 'vitest'
import { resolveAuthStatus } from './authState'

describe('authentication state', () => {
  it('reports unconfigured when Cognito settings are absent', () => {
    expect(resolveAuthStatus(false, false, false)).toBe('unconfigured')
  })

  it('requires both a user and access token before considering a session authenticated', () => {
    expect(resolveAuthStatus(true, false, true)).toBe('unauthenticated')
    expect(resolveAuthStatus(true, true, false)).toBe('unauthenticated')
    expect(resolveAuthStatus(true, true, true)).toBe('authenticated')
  })
})
