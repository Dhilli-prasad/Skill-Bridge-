import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'

export function ForgotPasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await auth.resetPassword(email)
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
        state: { message: 'If the account is eligible, Cognito has sent a password reset code.' },
      })
    } catch {
      setError(auth.error || 'We could not start password recovery. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Forgot password?</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Enter your account email and Cognito will send a password reset code.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        {(error || auth.error) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || auth.error}</p>}
        <button disabled={submitting} type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Sending code…' : 'Send reset code'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500"><Link to="/sign-in" className="font-semibold text-indigo-700 hover:underline">Back to sign in</Link></p>
    </div>
  )
}
