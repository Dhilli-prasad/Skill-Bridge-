import { Link } from 'react-router-dom'
import type { DeveloperProfile } from '../../../types/dashboard'
import { getDeveloperProfile } from '../../../services/developerProfileService'

export function DeveloperAvatar({ profile, size = 'sm' }: { profile?: DeveloperProfile; size?: 'sm' | 'lg' }) {
  const initials = profile?.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 font-bold text-violet-700 ${size === 'lg' ? 'h-20 w-20 text-xl' : 'h-10 w-10 text-sm'}`} aria-hidden="true">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}</span>
}

export function DeveloperLink({ id, className = '' }: { id: string; className?: string }) {
  const profile = getDeveloperProfile(id)
  return <Link to={`/developers/${id}`} className={`inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${className}`}>
    <DeveloperAvatar profile={profile} />
    <span>{profile?.fullName ?? id}</span>
  </Link>
}
