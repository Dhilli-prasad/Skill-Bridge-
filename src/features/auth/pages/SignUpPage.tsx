
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'

const passwordRules = [
  { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

export function SignUpPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const validPassword = passwordRules.every((rule) => rule.test(password))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    if (!validPassword) {
      setLocalError('Please meet all password requirements.')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const needsConfirmation = await auth.signUp(name, email, password)

      if (needsConfirmation) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      } else {
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Your account is ready. Please sign in.' },
        })
      }
    } catch {
      setLocalError(auth.error || 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Join SkillBridge
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Create your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Learn together, build together and grow your developer network.
        </p>

        {auth.status === 'unconfigured' ? (
          <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Cognito is not configured. Please configure the authentication environment first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">
                Password requirements
              </p>
              <ul className="space-y-1">
                {passwordRules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`text-xs ${rule.test(password) ? 'text-emerald-700' : 'text-slate-500'}`}
                  >
                    {rule.test(password) ? '✓' : '○'} {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Confirm password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            {(localError || auth.error) && (
              <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {localError || auth.error}
              </p>
            )}

            <button
              disabled={submitting || !validPassword || password !== confirmPassword}
              type="submit"
              className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-semibold text-indigo-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
