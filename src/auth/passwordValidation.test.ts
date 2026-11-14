import { describe, expect, it } from 'vitest'
import { validateLogin, validatePassword, validateRegistration } from './passwordValidation'

describe('authentication form validation', () => {
  it('checks all Cognito password policy requirements', () => {
    expect(validatePassword('SecurePassword12!')).toBe(true)
    expect(validatePassword('short')).toBe(false)
  })

  it('validates registration fields and matching passwords', () => {
    expect(validateRegistration('', 'ada@example.com', 'SecurePassword12!', 'SecurePassword12!')).toMatch(/full name/i)
    expect(validateRegistration('Ada', 'not-an-email', 'SecurePassword12!', 'SecurePassword12!')).toMatch(/email/i)
    expect(validateRegistration('Ada', 'ada@example.com', 'SecurePassword12!', 'SecurePassword13!')).toMatch(/do not match/i)
    expect(validateRegistration('Ada Lovelace', 'ada@example.com', 'SecurePassword12!', 'SecurePassword12!')).toBeUndefined()
  })

  it('validates login email and password', () => {
    expect(validateLogin('bad-email', 'password')).toMatch(/email/i)
    expect(validateLogin('ada@example.com', '')).toMatch(/password/i)
    expect(validateLogin('ada@example.com', 'password')).toBeUndefined()
  })
})
