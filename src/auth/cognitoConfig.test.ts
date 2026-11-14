import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCognitoConfig } from './cognitoConfig'

describe('Cognito frontend configuration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_COGNITO_REGION', 'ap-south-1')
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'ap-south-1_Abc123')
    vi.stubEnv('VITE_COGNITO_USER_POOL_CLIENT_ID', 'client123')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('returns the public Cognito identifiers when all values are valid', () => {
    expect(getCognitoConfig()).toEqual({ region: 'ap-south-1', userPoolId: 'ap-south-1_Abc123', userPoolClientId: 'client123' })
  })

  it('reports missing or malformed values as unconfigured', () => {
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', '')
    expect(getCognitoConfig()).toBeUndefined()
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_pool')
    expect(getCognitoConfig()).toBeUndefined()
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'ap-south-1_valid')
    vi.stubEnv('VITE_COGNITO_USER_POOL_CLIENT_ID', 'contains spaces')
    expect(getCognitoConfig()).toBeUndefined()
  })
})
