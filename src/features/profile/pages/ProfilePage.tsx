import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { useAuth } from '../../../auth/useAuth'
import { isApiConfigured } from '../../../services/apiClient'
import { COMMUNITY_USER_ID } from '../../../services/communityService'
import { getDeveloperProfile, updateDeveloperProfile } from '../../../services/developerProfileService'
import { getMyProfile, removeMyProfilePhoto, updateMyProfile, uploadMyProfilePhoto } from '../../../services/profileApi'
import { validateProfilePhoto } from '../../../services/profilePhoto'
import type { ProfileDraft, ProfileRecord } from '../../../types/profile'
import type { DeveloperProfile } from '../../../types/dashboard'

const emptyDraft: ProfileDraft = {
  fullName: '', location: '', bio: '', skills: [], experienceLevel: 'Beginner',
  interests: [], githubUrl: '', linkedinUrl: '', portfolioUrl: '',
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function fromDemo(profile: DeveloperProfile): ProfileDraft {
  return {
    fullName: profile.fullName, location: profile.location ?? '', bio: profile.bio,
    skills: profile.skills, experienceLevel: profile.experienceLevel ?? 'Beginner',
    interests: profile.interests, githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '', portfolioUrl: profile.portfolioUrl ?? '',
  }
}

function Photo({ name, src }: { name: string; src?: string | null }) {
  return <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 text-2xl font-bold text-violet-700 ring-4 ring-white shadow-md sm:h-28 sm:w-28" aria-label={`${name || 'Developer'} profile photo`}>
    {src ? <img src={src} alt={`${name || 'Developer'} profile`} className="h-full w-full object-cover" /> : initials(name)}
  </div>
}

function ProfileForm({
  draft, onChange, email, saving, disabled = false,
}: {
  draft: ProfileDraft
  onChange: (draft: ProfileDraft) => void
  email: string
  saving: boolean
  disabled?: boolean
}) {
  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => onChange({ ...draft, [key]: value })
  const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  const field = (key: 'fullName' | 'location' | 'githubUrl' | 'linkedinUrl' | 'portfolioUrl', label: string, type = 'text') => <label className="block text-sm font-semibold text-slate-700">{label}<input disabled={disabled || saving} type={type} value={draft[key] ?? ''} maxLength={key === 'fullName' ? 80 : key === 'location' ? 80 : 500} onChange={(event) => update(key, event.target.value)} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} /></label>

  return <div className="grid gap-5 sm:grid-cols-2">
    {field('fullName', 'Full name')}
    <label className="block text-sm font-semibold text-slate-700">Email address<input readOnly value={email} placeholder="Available after you sign in" className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`} /><span className="mt-1 block text-xs font-normal text-slate-400">Managed by your verified Cognito account.</span></label>
    {field('location', 'Location')}
    <label className="block text-sm font-semibold text-slate-700">Experience level<select disabled={disabled || saving} value={draft.experienceLevel} onChange={(event) => update('experienceLevel', event.target.value as ProfileDraft['experienceLevel'])} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option></select></label>
    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Professional bio<textarea disabled={disabled || saving} value={draft.bio} maxLength={280} onChange={(event) => update('bio', event.target.value)} rows={4} className={`${inputClass} py-3 disabled:bg-slate-50 disabled:text-slate-500`} placeholder="A short introduction about your work and goals." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{draft.bio.length}/280</span></label>
    <label className="block text-sm font-semibold text-slate-700">Skills and technologies<input disabled={disabled || saving} value={draft.skills.join(', ')} onChange={(event) => update('skills', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} placeholder="React, TypeScript, AWS" /><span className="mt-1 block text-xs font-normal text-slate-400">Separate skills with commas.</span></label>
    <label className="block text-sm font-semibold text-slate-700">Learning interests<input disabled={disabled || saving} value={draft.interests.join(', ')} onChange={(event) => update('interests', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} placeholder="Accessibility, distributed systems" /><span className="mt-1 block text-xs font-normal text-slate-400">Separate interests with commas.</span></label>
    {field('githubUrl', 'GitHub URL', 'url')}{field('linkedinUrl', 'LinkedIn URL', 'url')}{field('portfolioUrl', 'Portfolio URL', 'url')}
    <div className="flex items-end text-xs text-slate-400 sm:col-span-2">{saving ? 'Saving changes…' : 'Your profile email comes from Cognito and cannot be edited here.'}</div>
  </div>
}

export function ProfilePage() {
  const auth = useAuth()
  if (auth.status === 'loading') return <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading your account…</p>
  if (auth.status === 'authenticated') {
    if (!isApiConfigured()) return <ProfileApiConfigurationRequired />
    return <AccountProfile email={auth.user?.username ?? ''} />
  }
  return <DemoProfile />
}

function ProfileApiConfigurationRequired() {
  return <section role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 sm:p-8"><h1 className="text-2xl font-bold">Profile API configuration required</h1><p className="mt-3 text-sm leading-6">Your Cognito session is active, but profile data requires the backend API. Configure <code className="rounded bg-amber-100 px-1.5 py-0.5">VITE_API_BASE_URL</code> with this environment’s CloudFormation <code className="rounded bg-amber-100 px-1.5 py-0.5">ApiUrl</code> output, then restart Vite or rebuild the Amplify branch.</p></section>
}

function AccountProfile({ email }: { email: string }) {
  const [profile, setProfile] = useState<ProfileRecord>()
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const previewRef = useRef<string | undefined>(undefined)
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    getMyProfile().then((result) => {
      if (!active) return
      setProfile(result)
      setDraft({ ...emptyDraft, ...result })
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your profile.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])

  const clearPhoto = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = undefined
    setPhoto(undefined)
    setPreview(undefined)
  }

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const issue = validateProfilePhoto(file)
    if (issue) { setError(issue); return }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const url = URL.createObjectURL(file)
    previewRef.current = url
    setPreview(url)
    setError(''); setMessage(''); setPhoto(file)
  }

  const save = async () => {
    setSaving(true); setError(''); setMessage('')
    try {
      const result = await updateMyProfile(draft)
      setProfile(result); setDraft({ ...emptyDraft, ...result }); setEditing(false); setMessage('Your profile has been saved.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save your profile.') }
    finally { setSaving(false) }
  }

  const upload = async () => {
    if (!photo) return
    setProgress(0); setError(''); setMessage('')
    try {
      const result = await uploadMyProfilePhoto(photo, setProgress)
      setProfile(result); clearPhoto(); setMessage('Profile photo updated.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Photo upload failed. Try again.') }
    finally { setProgress(undefined) }
  }

  const removePhoto = async () => {
    setError(''); setMessage('')
    try { const result = await removeMyProfilePhoto(); setProfile(result); clearPhoto(); setMessage('Profile photo removed.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to remove your photo.') }
  }

  if (loading) return <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading your profile…</p>
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-300">Your account</p><div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center"><Photo name={draft.fullName} src={preview ?? profile?.photoUrl} /><div><h1 className="text-3xl font-bold tracking-tight">Developer profile</h1><p className="mt-2 text-sm text-slate-300">Keep your professional details current across SkillBridge.</p><p className="mt-2 text-sm text-indigo-200">{email}</p></div></div></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Profile photo</h2><p className="mt-1 text-sm text-slate-500">JPG, JPEG, PNG, or WebP. Maximum size 5 MB.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Icon name="upload" size={16} />{profile?.photoUrl ? 'Change photo' : 'Choose photo'}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choosePhoto} className="sr-only" /></label></div>
      {photo && <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm text-slate-600">{photo.name}</span><button type="button" disabled={progress !== undefined} onClick={clearPhoto} className="text-sm font-semibold text-slate-500 disabled:opacity-50">Cancel</button><button type="button" disabled={progress !== undefined} onClick={() => void upload()} className="min-h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{progress === undefined ? 'Upload photo' : `Uploading ${progress}%`}</button></div>}
      {progress !== undefined && <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div>}
      {profile?.photoUrl && !photo && <button type="button" disabled={progress !== undefined} onClick={() => void removePhoto()} className="mt-3 text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50">Remove photo</button>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Professional details</h2><p className="mt-1 text-sm text-slate-500">Your email is read-only and comes from Cognito.</p></div>{!editing && <button type="button" disabled={!profile || progress !== undefined} onClick={() => setEditing(true)} className="min-h-11 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 disabled:opacity-50">Edit profile</button>}</div><ProfileForm draft={draft} onChange={setDraft} email={email} saving={saving} disabled={!editing || !profile || progress !== undefined} />{editing && <div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" disabled={saving} onClick={() => { setDraft({ ...emptyDraft, ...(profile ?? {}) }); setEditing(false) }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="button" disabled={saving || !profile || progress !== undefined} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button></div>}</section>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}
  </div>
}

function DemoProfile() {
  const profile = useMemo(() => getDeveloperProfile(COMMUNITY_USER_ID), [])
  const [draft, setDraft] = useState<ProfileDraft>(() => profile ? fromDemo(profile) : emptyDraft)
  const [preview, setPreview] = useState<string>()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (!profile) return <p role="alert" className="rounded-xl bg-rose-50 p-5 text-sm text-rose-700">Demo profile is unavailable.</p>
  const save = () => {
    const result = updateDeveloperProfile({ ...draft, username: profile.username, githubUrl: draft.githubUrl ?? '', linkedinUrl: draft.linkedinUrl ?? '' })
    if (result.ok) { setError(''); setMessage('Demo profile changes saved in this browser.') }
    else setError(result.message)
  }
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const issue = validateProfilePhoto(file)
    if (issue) { setError(issue); return }
    setPreview(URL.createObjectURL(file)); setError(''); setMessage('Photo preview only. Sign in to upload it securely.')
  }
  return <div className="mx-auto max-w-5xl space-y-6"><header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-300">Local demo profile</p><h1 className="mt-2 text-3xl font-bold">Developer profile</h1><p className="mt-2 text-sm text-slate-300">Demo data stays in this browser. Sign in to manage a Cognito profile and securely upload a photo.</p></header><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6 flex flex-wrap items-center gap-5"><Photo name={draft.fullName} src={preview ?? profile.avatarUrl} /><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Preview photo<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choose} className="sr-only" /></label></div><ProfileForm draft={draft} onChange={setDraft} email="" saving={false} /><button type="button" onClick={save} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white">Save changes</button></section>{error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">{message}</p>}<p className="text-sm text-slate-500"><Link to={`/developers/${COMMUNITY_USER_ID}`} className="font-semibold text-indigo-700">View your public demo profile</Link></p></div>
}
