import { describe, expect, it } from 'vitest'
import { protectedRouteDestination } from './protectedRouteState'

describe('protected route decisions', () => {
  it('keeps disabled demo routes public', () => {
    expect(protectedRouteDestination('unauthenticated', false, '/projects')).toBeUndefined()
  })

  it('waits for restoration and redirects unauthenticated API routes', () => {
    expect(protectedRouteDestination('loading', true, '/projects/p-1?tab=tasks')).toBe('loading')
    expect(protectedRouteDestination('unauthenticated', true, '/projects/p-1?tab=tasks')).toBe('/sign-in?returnTo=%2Fprojects%2Fp-1%3Ftab%3Dtasks')
  })

  it('allows authenticated users through', () => {
    expect(protectedRouteDestination('authenticated', true, '/projects')).toBeUndefined()
  })
})
