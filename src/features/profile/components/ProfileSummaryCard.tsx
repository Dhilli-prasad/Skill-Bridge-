import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile, getProfileById } from '../../../services/profileApi'
import type { ProfileRecord } from '../../../types/profile'
import { ProfileIdentity } from './ProfileIdentity'
import { useAuth } from '../../../auth/useAuth'

export function ProfileSummaryCard({ userId, self = false }: { userId?: string; self?: boolean }) {
  const auth = useAuth()
  const [loaded, setLoaded] = useState<{ key: string; profile: ProfileRecord }>()
  const key = `${self || !userId ? 'me' : userId}:${auth.status}`
  useEffect(() => {
    let active = true
    if (auth.status !== 'authenticated') return () => { active = false }
    const request = self || !userId ? getMyProfile() : getProfileById(userId)
    request.then((profile) => { if (active) setLoaded({ key, profile }) }).catch(() => undefined)
    return () => { active = false }
  }, [auth.status, key, self, userId])
  const profile = loaded?.key === key && auth.status === 'authenticated' ? loaded.profile : undefined
  if (!profile) return null
  return <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="min-w-0"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">SkillBridge profile</p><ProfileIdentity profile={profile} /></div><div className="flex flex-wrap gap-2">{profile.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{skill}</span>)}<Link to="/profile" className="min-h-10 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700">Edit profile</Link></div></section>
}
