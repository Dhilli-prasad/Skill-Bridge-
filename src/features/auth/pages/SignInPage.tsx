import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import { requiredCognitoEnvironment } from '../../../auth/cognitoConfig'

function safeReturnTo(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export function SignInPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const returnTo = safeReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const message = (location.state as { message?: string } | null)?.message

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await auth.signIn(username, password)
      navigate(returnTo, { replace: true })
    } catch {
      // AuthContext stores a user-facing error for the form.
    } finally {
      setSubmitting(false)
    }
  }

  if (auth.status === 'authenticated') {
    return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-950">You are signed in</h1><button type="button" onClick={() => navigate(returnTo)} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Continue to SkillBridge</button></div>
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">SkillBridge account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in to collaborate</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Use your Cognito account to access authenticated project collaboration data.</p>
        {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {auth.status === 'loading' ? (
          <p role="status" className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Restoring your session…</p>
        ) : auth.status === 'unconfigured' ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Cognito is not configured</p>
            <p className="mt-1">Set these Vite environment variables before using protected API mode:</p>
            <ul className="mt-2 list-disc pl-5">{requiredCognitoEnvironment.map((name) => <li key={name}><code>{name}</code></li>)}</ul>
            <Link to="/" className="mt-4 inline-block font-semibold text-indigo-700 hover:underline">Return to demo mode</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
            <label className="block text-sm font-medium text-slate-700">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
            {auth.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{auth.error}</p>}
            <div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-semibold text-indigo-700 hover:underline">Forgot password?</Link></div>
            <button disabled={submitting} type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">New to SkillBridge? <Link to="/sign-up" className="font-semibold text-indigo-700 hover:underline">Create an account</Link></p>
        <p className="mt-3 text-center text-xs text-slate-400">Local demo mode remains available until an API mode is explicitly enabled.</p>
      </div>
    </div>
  )
}
