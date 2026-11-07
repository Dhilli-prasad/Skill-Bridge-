import { Link } from 'react-router-dom'
import type { DeveloperProfile } from '../../../types/dashboard'
import { DeveloperAvatar } from './DeveloperLink'
import { getFollowerCount, isFollowing, toggleFollowing } from '../../../services/developerProfileService'

export function DeveloperCard({ profile, onChange }: { profile: DeveloperProfile; onChange?: (message: string) => void }) {
  const follow = () => {
    const result = toggleFollowing(profile.id)
    onChange?.(result.message)
  }
  return <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
    <div className="flex items-start gap-3"><DeveloperAvatar profile={profile} /><div className="min-w-0"><Link to={`/developers/${profile.id}`} className="font-bold text-slate-950 hover:text-indigo-700">{profile.fullName}</Link><p className="text-sm text-slate-500">@{profile.username}</p>{profile.location && <p className="mt-1 text-xs text-slate-400">{profile.location}</p>}</div></div>
    <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{profile.bio}</p>
    <div className="mt-4 flex flex-wrap gap-1.5">{profile.skills.slice(0, 5).map((skill) => <span key={skill} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{skill}</span>)}</div>
    <div className="mt-3 flex flex-wrap gap-1.5">{profile.interests.slice(0, 2).map((interest) => <span key={interest} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{interest}</span>)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{getFollowerCount(profile.id)} followers</span><div className="flex gap-2"><Link to={`/developers/${profile.id}`} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View profile</Link>{profile.id !== 'demo-user-aarav-kumar' && <button type="button" onClick={follow} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700">{isFollowing(profile.id) ? 'Unfollow' : 'Follow'}</button>}</div></div>
  </article>
}
