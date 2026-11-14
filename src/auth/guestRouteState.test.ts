import { describe, expect, it } from 'vitest'
import { guestRouteDestination } from './guestRouteState'

describe('guest route redirects', () => {
  it('waits for session restoration before rendering a guest page', () => {
    expect(guestRouteDestination('loading')).toBe('loading')
  })

  it('redirects authenticated users to a safe requested page', () => {
    expect(guestRouteDestination('authenticated', '/projects/p-1')).toBe('/projects/p-1')
    expect(guestRouteDestination('authenticated', '//example.com')).toBe('/')
  })

  it('allows unauthenticated and unconfigured users to view guest pages', () => {
    expect(guestRouteDestination('unauthenticated')).toBeUndefined()
    expect(guestRouteDestination('unconfigured')).toBeUndefined()
  })
})
