import { describe, expect, it } from 'vitest'
import { validateProfilePhoto } from './profilePhoto'

describe('profile photo validation', () => {
  it('accepts supported image formats at or below 5 MB', () => {
    expect(validateProfilePhoto({ name: 'portrait.JPG', type: 'image/jpeg', size: 1000 })).toBeUndefined()
    expect(validateProfilePhoto({ name: 'portrait.webp', type: 'image/webp', size: 5 * 1024 * 1024 })).toBeUndefined()
  })

  it('rejects unsupported types and oversized images', () => {
    expect(validateProfilePhoto({ name: 'portrait.svg', type: 'image/svg+xml', size: 1000 })).toMatch(/JPG/i)
    expect(validateProfilePhoto({ name: 'portrait.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toMatch(/5 MB/i)
  })
})
