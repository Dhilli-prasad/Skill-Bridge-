import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'

export function VerifyEmailPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryEmail = new URLSearchParams(location.search).get('email') ?? ''
  const [email, setEmail] = useState(queryEmail)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const complete = await auth.confirmSignUp(email, code)
      if (complete) {
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Email confirmed. You can now sign in.' },
        })
      } else {
        setMessage('Cognito accepted the code but reports that account confirmation is not complete yet. Follow any additional instructions Cognito sent before signing in.')
      }
    } catch {
      setError(auth.error || 'We could not confirm that code. Please check it and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await auth.resendSignUpCode(email)
      setMessage('A new confirmation code has been sent if the account can receive one.')
    } catch {
      setError(auth.error || 'We could not resend the confirmation code.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Verify your email</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Confirm your account</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Enter the code Cognito emailed you. Your account cannot be used to sign in until the email is confirmed.</p>
      <form onSubmit={handleConfirm} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        <label className="block text-sm font-medium text-slate-700">Confirmation code<input required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
        {(error || auth.error) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || auth.error}</p>}
        {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        <button disabled={submitting} type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? 'Confirming…' : 'Confirm email'}</button>
      </form>
      <button disabled={submitting || !email} onClick={() => void handleResend()} type="button" className="mt-3 min-h-10 w-full text-sm font-semibold text-indigo-700 hover:underline disabled:opacity-50">Resend confirmation code</button>
      <p className="mt-4 text-center text-sm text-slate-500"><Link to="/sign-in" className="font-semibold text-indigo-700 hover:underline">Back to sign in</Link></p>
    </div>
  )
}
