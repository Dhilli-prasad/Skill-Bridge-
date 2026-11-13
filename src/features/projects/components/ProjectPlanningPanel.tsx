import { useCallback, useEffect, useState } from 'react'
import { ApiClientError } from '../../../services/apiClient'
import { createProjectMilestone, createProjectTask, listProjectMilestones, listProjectTasks, updateProjectMilestone, updateProjectTask, type ProjectMilestone, type ProjectTask } from '../../../services/projectApi'
import type { ProjectMember } from '../../../services/projectApi'
import { runWithLoading } from '../../../services/asyncState'

export function ProjectPlanningPanel({ projectId, canManage, members, currentUserId }: { projectId: string; canManage: boolean; members: ProjectMember[]; currentUserId: string }) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [milestoneId, setMilestoneId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const [milestoneResult, taskResult] = await Promise.all([listProjectMilestones(projectId), listProjectTasks(projectId)])
    setMilestones(milestoneResult.data)
    setTasks(taskResult.data)
  }, [projectId])
  useEffect(() => {
    let active = true
    runWithLoading(setLoading, () => Promise.all([listProjectMilestones(projectId), listProjectTasks(projectId)])).then(([milestoneResult, taskResult]) => {
      if (!active) return
      setMilestones(milestoneResult.data); setTasks(taskResult.data)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiClientError && cause.status === 401 ? 'Your session expired. Sign in again to view project planning.' : cause instanceof Error ? cause.message : 'Unable to load project planning.')
    })
    return () => { active = false }
  }, [projectId])

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('')
    try { await action(); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The project update failed.') }
    finally { setBusy(false) }
  }
  const createMilestone = (event: React.FormEvent) => {
    event.preventDefault()
    if (!milestoneTitle.trim()) return
    void run(async () => { await createProjectMilestone(projectId, { title: milestoneTitle.trim(), description: '', order: milestones.length + 1 }); setMilestoneTitle('') })
  }
  const createTask = (event: React.FormEvent) => {
    event.preventDefault()
    if (!taskTitle.trim()) return
    void run(async () => { await createProjectTask(projectId, { title: taskTitle.trim(), milestoneId: milestoneId || undefined, assigneeId: assigneeId || undefined, priority: 'MEDIUM' }); setTaskTitle('') })
  }
  const nextStatus: Record<ProjectTask['status'], ProjectTask['status'] | undefined> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'IN_REVIEW', IN_REVIEW: 'COMPLETED', COMPLETED: undefined }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-xl font-bold text-slate-950">Milestones and tasks</h2><p className="mt-1 text-sm text-slate-500">Changes are saved to the shared project backend.</p></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <p role="status" className="mt-4 text-sm text-slate-500">Loading milestones and tasks…</p> : <>
      <div className="mt-4 space-y-2">{milestones.map((item) => <div key={item.milestoneId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-500">{item.progress?.completedTasks ?? 0}/{item.progress?.totalTasks ?? 0} tasks · {item.status}</p></div>{canManage && item.status !== 'COMPLETED' && <button disabled={busy || (item.progress?.completedTasks ?? 0) !== (item.progress?.totalTasks ?? 0)} onClick={() => void run(() => updateProjectMilestone(projectId, item.milestoneId, { status: 'COMPLETED' }))} className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-40">Complete milestone</button>}</div>)}{milestones.length === 0 && <p className="text-sm text-slate-500">No milestones yet.</p>}</div>
      {canManage && <form onSubmit={createMilestone} className="mt-4 flex flex-wrap gap-2"><input aria-label="New milestone title" value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Milestone title" className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><button disabled={busy || !milestoneTitle.trim()} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-50">Add milestone</button></form>}
      <div className="mt-6 space-y-2">{tasks.map((task) => { const next = nextStatus[task.status]; const mayUpdate = canManage || task.assigneeId === currentUserId; return <article key={task.taskId} className="rounded-xl border border-slate-100 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{task.title}</p><p className="text-xs text-slate-500">{task.status.replaceAll('_', ' ')} · {task.priority}{task.milestoneId ? ` · ${milestones.find((item) => item.milestoneId === task.milestoneId)?.title ?? 'Milestone'}` : ''}</p></div>{mayUpdate && next && <button disabled={busy} onClick={() => void run(() => updateProjectTask(projectId, task.taskId, { status: next }))} className="min-h-9 rounded-lg border border-indigo-200 px-3 text-xs font-semibold text-indigo-700">Move to {next.replaceAll('_', ' ').toLowerCase()}</button>}</div>{canManage && <div className="mt-3 flex flex-wrap gap-2"><label className="text-xs text-slate-500">Assignee <select aria-label={`Assignee for ${task.title}`} value={task.assigneeId ?? ''} disabled={busy} onChange={(event) => { if (event.target.value) void run(() => updateProjectTask(projectId, task.taskId, { assigneeId: event.target.value })) }} className="ml-2 min-h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">Unassigned</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.role}: {member.userId}</option>)}</select></label></div>}</article>})}{tasks.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}</div>
      {canManage && <form onSubmit={createTask} className="mt-4 grid gap-2 sm:grid-cols-4"><input aria-label="New task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" /><select aria-label="Task milestone" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="">No milestone</option>{milestones.filter((item) => item.status !== 'COMPLETED').map((item) => <option key={item.milestoneId} value={item.milestoneId}>{item.title}</option>)}</select><select aria-label="Task assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="">Unassigned</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.role}: {member.userId}</option>)}</select><button disabled={busy || !taskTitle.trim()} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-4">Add task</button></form>}
    </>}
  </section>
}
