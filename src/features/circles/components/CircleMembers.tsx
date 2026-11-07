import { useMemo, useState } from 'react'
import { getCircleMembers, removeCircleMember, updateMemberRole } from '../../../services/circleMembership'
import type { CircleMember, CircleMemberRole, LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

interface CircleMembersProps {
  circle: LearningCircle
  canManage: boolean
  onFeedback: (message: string) => void
}

const roleStyles: Record<CircleMemberRole, string> = {
  Owner: 'bg-amber-50 text-amber-700',
  Moderator: 'bg-indigo-50 text-indigo-700',
  Member: 'bg-slate-100 text-slate-600',
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function MemberDetails({ member, onClose }: { member: CircleMember; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button type="button" aria-label="Close member details" onClick={onClose} className="absolute inset-0 bg-slate-950/40" /><section role="dialog" aria-modal="true" aria-labelledby="member-details-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700">{initials(member.name)}</div><div><h3 id="member-details-title" className="text-xl font-bold text-slate-950">{member.name}</h3><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[member.role]}`}>{member.role}</span></div></div><p className="mt-5 text-sm leading-6 text-slate-600">{member.bio}</p><div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Technical interests</p><div className="mt-2 flex flex-wrap gap-2">{member.interests.map((interest) => <span key={interest} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{interest}</span>)}</div></div><p className="mt-5 text-xs text-slate-400">Joined {new Date(member.joinedAt).toLocaleDateString()}</p><button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Close details</button></section></div>
}

function RemoveConfirmation({ member, onCancel, onConfirm }: { member: CircleMember; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button type="button" aria-label="Cancel removing member" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><section role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 id="remove-member-title" className="text-xl font-bold text-slate-950">Remove {member.name}?</h3><p className="mt-2 text-sm leading-6 text-slate-500">This removes the member from this local demo circle. They can be added again in a future backend-powered flow.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Remove member</button></div></section></div>
}

export function CircleMembers({ circle, canManage, onFeedback }: CircleMembersProps) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null)
  const [removeTarget, setRemoveTarget] = useState<CircleMember | null>(null)
  const [busyMemberId, setBusyMemberId] = useState('')
  const members = getCircleMembers(circle)
  const filteredMembers = useMemo(() => members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase().trim()) && (!role || member.role === role)), [members, query, role])

  const changeRole = (member: CircleMember, nextRole: CircleMemberRole) => {
    setBusyMemberId(member.id)
    window.setTimeout(() => {
      const result = updateMemberRole(circle, member.id, nextRole)
      onFeedback(result.message)
      setBusyMemberId('')
    }, 250)
  }

  const confirmRemove = () => {
    if (!removeTarget) return
    setBusyMemberId(removeTarget.id)
    window.setTimeout(() => {
      const result = removeCircleMember(circle, removeTarget.id)
      onFeedback(result.message)
      setBusyMemberId('')
      setRemoveTarget(null)
    }, 250)
  }

  return <section className="mt-6 border-t border-slate-100 pt-6" aria-labelledby="circle-members-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 id="circle-members-title" className="text-lg font-semibold text-slate-950">Members</h3><p className="mt-1 text-sm text-slate-500">Meet the people learning together in this circle.</p></div><span className="text-sm text-slate-400">{members.length} shown</span></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><label className="relative"><span className="sr-only">Search members by name</span><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members..." className="min-h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label><span className="sr-only">Filter members by role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All roles</option><option>Owner</option><option>Moderator</option><option>Member</option></select></label><button type="button" onClick={() => { setQuery(''); setRole('') }} disabled={!query && !role} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:opacity-40">Clear</button></div>{filteredMembers.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{filteredMembers.map((member) =>   <article key={member.id} className="min-w-0 rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(member.name)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="truncate font-semibold text-slate-900">{member.name}</h4><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${roleStyles[member.role]}`}>{member.role}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{member.bio}</p><p className="mt-2 truncate text-xs text-slate-400">{member.interests.join(' · ')}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedMember(member)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">View details</button>{canManage && member.role !== 'Owner' && <>{member.role === 'Member' ? <button type="button" disabled={busyMemberId === member.id} onClick={() => changeRole(member, 'Moderator')} className="min-h-10 rounded-lg border border-indigo-200 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{busyMemberId === member.id ? 'Saving...' : 'Promote'}</button> : <button type="button" disabled={busyMemberId === member.id} onClick={() => changeRole(member, 'Member')} className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{busyMemberId === member.id ? 'Saving...' : 'Demote'}</button>}<button type="button" disabled={busyMemberId === member.id} onClick={() => setRemoveTarget(member)} className="min-h-10 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Remove</button></>}</div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center"><Icon name="users-round" className="mx-auto text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No members found</p><p className="mt-1 text-xs text-slate-500">Try a different name or role filter.</p></div>}{selectedMember && <MemberDetails member={selectedMember} onClose={() => setSelectedMember(null)} />}{removeTarget && <RemoveConfirmation member={removeTarget} onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove} />}</section>
}
