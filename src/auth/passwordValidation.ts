export const passwordRules = [
  { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

export function validatePassword(value: string) {
  return passwordRules.every((rule) => rule.test(value))
}

export function validateRegistration(name: string, email: string, password: string, confirmation: string) {
  if (!name.trim()) return 'Enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.'
  if (!validatePassword(password)) return 'Please meet all password requirements.'
  if (password !== confirmation) return 'Passwords do not match.'
  return undefined
}

export function validateLogin(email: string, password: string) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.'
  if (!password) return 'Enter your password.'
  return undefined
}
