import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCurrentCognitoUser } from '../../../../auth/cognito'
import { ApiClientError } from '../../../../services/apiClient'
import { createJoinRequest, getApiProject, listJoinRequests, listProjectMembers, reviewJoinRequest, type JoinRequest, type ProjectMember } from '../../../../services/projectApi'
import type { CollaborationProject, ProjectRole } from '../../../../types/dashboard'
import { ProjectCollaborationPanel } from '../../components/ProjectCollaborationPanel'
import { ProjectPlanningPanel } from '../../components/ProjectPlanningPanel'
import { getProfiles } from '../../../../services/profileApi'
import type { ProfileRecord } from '../../../../types/profile'
import { ProfileIdentity } from '../../../profile/components/ProfileIdentity'

export function ApiProjectDetailPage() {
  const { projectId = '' } = useParams()
  const [project, setProject] = useState<CollaborationProject>()
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [memberProfiles, setMemberProfiles] = useState<Record<string, ProfileRecord>>({})
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [userId, setUserId] = useState('')
  const [joinRole, setJoinRole] = useState<Exclude<ProjectRole, 'Owner'>>('Contributor')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const [item, team, currentUser] = await Promise.all([getApiProject(projectId), listProjectMembers(projectId), getCurrentCognitoUser()])
    setProject(item); setMembers(team); setUserId(currentUser?.userId ?? '')
    const profiles = await getProfiles(team.map((member) => member.userId))
    setMemberProfiles(Object.fromEntries(profiles.map((profile) => [profile.id, profile])))
    if (team.some((member) => member.userId === currentUser?.userId && member.role === 'Owner')) {
      const requestsResult = await listJoinRequests(projectId)
      setRequests(requestsResult.data.filter((request) => request.status === 'pending'))
    } else setRequests([])
  }, [projectId])

  useEffect(() => {
    let active = true
    Promise.all([getApiProject(projectId), listProjectMembers(projectId), getCurrentCognitoUser()]).then(async ([item, team, user]) => {
      if (!active) return
      setProject(item); setMembers(team); setUserId(user?.userId ?? '')
      const profiles = await getProfiles(team.map((member) => member.userId))
      if (active) setMemberProfiles(Object.fromEntries(profiles.map((profile) => [profile.id, profile])))
      if (team.some((member) => member.userId === user?.userId && member.role === 'Owner')) {
        const requestResult = await listJoinRequests(projectId)
        if (active) setRequests(requestResult.data.filter((request) => request.status === 'pending'))
      }
    }).catch((cause: unknown) => { if (active) setError(cause instanceof ApiClientError && cause.status === 401 ? 'Your session expired. Sign in again to view this project.' : cause instanceof Error ? cause.message : 'Unable to load this project.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [projectId])

  const act = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true); setError(''); setMessage('')
    try { await action(); await refresh(); if (success) setMessage(success) }
    catch (cause) { setError(cause instanceof ApiClientError && cause.status === 403 ? 'The backend denied this action for your account.' : cause instanceof Error ? cause.message : 'The request failed.') }
    finally { setBusy(false) }
  }

  if (loading) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading project…</p>
  if (error && !project) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}<Link to="/projects" className="ml-2 font-semibold">Browse projects</Link></div>
  if (!project) return <div className="rounded-xl border border-slate-200 bg-white p-6">Project not found. <Link to="/projects" className="font-semibold text-indigo-700">Browse projects</Link></div>
  const owner = members.find((member) => member.role === 'Owner')
  const isOwner = owner?.userId === userId
  const isMember = members.some((member) => member.userId === userId)
  const canJoin = project.status === 'Recruiting' && project.memberIds.length < project.capacity && !isMember

  return <div className="mx-auto max-w-4xl space-y-6"><Link to="/projects" className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700">← All projects</Link>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{project.status}</span><span className="text-sm text-slate-500">{project.difficulty} · {project.category}</span></div><h1 className="mt-4 text-3xl font-bold text-slate-950">{project.title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{project.fullDescription}</p><div className="mt-5 flex flex-wrap gap-2">{project.technology.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">{item}</span>)}</div><p className="mt-4 text-sm text-slate-500">Created {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(project.createdAt))} · {members.length}/{project.capacity} team members</p>
      {canJoin && <div className="mt-5 flex flex-wrap items-end gap-2"><label className="text-sm font-medium text-slate-700">Role<select aria-label="Role when joining" value={joinRole} onChange={(event) => setJoinRole(event.target.value as Exclude<ProjectRole, 'Owner'>)} className="mt-1 min-h-11 rounded-lg border border-slate-200 px-3">{['Developer', 'Designer', 'Tester', 'Contributor'].map((role) => <option key={role}>{role}</option>)}</select></label><button disabled={busy} onClick={() => void act(() => createJoinRequest(project.id, joinRole), 'Join request submitted.')} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Request to join</button></div>}
      {isMember && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">You are an approved project member.</p>}{message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </section>
    <ProjectCollaborationPanel projectId={project.id} canManage={isOwner} currentUserId={userId} isMember={isMember} />
    <ProjectPlanningPanel projectId={project.id} canManage={isOwner} members={members} currentUserId={userId} />
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Goals and outcomes</h2><h3 className="mt-4 text-sm font-semibold text-slate-700">Goals</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">{project.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul><h3 className="mt-4 text-sm font-semibold text-slate-700">Expected outcomes</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Team</h2><p className="mt-1 text-sm text-slate-500">{members.length} of {project.capacity} members</p><div className="mt-4 space-y-3">{members.map((member) => <div key={member.userId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><ProfileIdentity profile={memberProfiles[member.userId]} fallbackName={member.userId} /><span className="ml-2 text-xs font-semibold text-slate-500">{member.role}</span></div>)}</div></section></div>
    {isOwner && requests.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Join requests</h2><div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-semibold text-slate-800">{request.requesterId}</p><p className="text-xs text-slate-500">{request.role} · {new Date(request.createdAt).toLocaleDateString()}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => void act(() => reviewJoinRequest(project.id, request.id, 'approve'), 'Join request approved.')} className="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => void act(() => reviewJoinRequest(project.id, request.id, 'reject'))} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50">Reject</button></div></div>)}</div></section>}
    {owner && <p className="text-xs text-slate-400">Project owner: {owner.userId}</p>}
  </div>
}
