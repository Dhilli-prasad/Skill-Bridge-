import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'

const passwordRules = [
  (value: string) => value.length >= 12,
  (value: string) => /[a-z]/.test(value),
  (value: string) => /[A-Z]/.test(value),
  (value: string) => /\d/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
]

export function ResetPasswordPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(new URLSearchParams(location.search).get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const message = (location.state as { message?: string } | null)?.message

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!passwordRules.every((rule) => rule(password))) {
      setError('Password must be at least 12 characters and include lowercase, uppercase, a number, and a symbol.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await auth.confirmResetPassword(email, code, password)
      navigate('/sign-in', { replace: true, state: { message: 'Password updated. You can now sign in.' } })
    } catch {
      setError(auth.error || 'We could not reset your password. Check the code and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Reset your password</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Enter the code sent to your email and choose a new password.</p>
      {message && <p role="status" className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{message}</p>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        <label className="block text-sm font-medium text-slate-700">Reset code<input required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        <label className="block text-sm font-medium text-slate-700">New password<input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        <label className="block text-sm font-medium text-slate-700">Confirm new password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        {(error || auth.error) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || auth.error}</p>}
        <button disabled={submitting} type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Updating password…' : 'Reset password'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500"><Link to="/forgot-password" className="font-semibold text-indigo-700 hover:underline">Request another code</Link></p>
    </div>
  )
}
