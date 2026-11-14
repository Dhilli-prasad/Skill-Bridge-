import type { ProfileRecord } from '../../../types/profile'

export function ProfileIdentity({ profile, fallbackName = 'SkillBridge developer' }: { profile?: Pick<ProfileRecord, 'fullName' | 'photoUrl'>; fallbackName?: string }) {
  const name = profile?.fullName || fallbackName
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'
  return <span className="inline-flex min-w-0 items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 text-xs font-bold text-violet-700">{profile?.photoUrl ? <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" /> : initials}</span><span className="truncate text-sm font-semibold text-slate-800">{name}</span></span>
}
