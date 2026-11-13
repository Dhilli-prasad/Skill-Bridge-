import { useEffect, useState } from 'react'
import { ApiClientError, apiRequest } from '../../../services/apiClient'
import { confirmProjectCompletion, rejectProjectCompletion, submitProjectCompletion } from '../../../services/projectApi'

interface ProgressSummary { overallCompletionPercentage: number; totalMilestones: number; completedMilestones: number; totalTasks: number; completedTasks: number; inProgressTasks: number; tasksInReview: number; todoTasks: number; overdueTasks: number }
interface ActivityRecord { activityId: string; type: string; createdAt: string }
interface CompletionSummary { status: string; confirmedMembers?: number; teamSize: number; confirmations?: Array<{ userId: string; status: string }> }
const API_MODE = import.meta.env.VITE_PROJECT_COLLABORATION_MODE === 'api'

export function ProjectCollaborationPanel({ projectId, canManage, currentUserId = '', isMember = false }: { projectId: string; canManage: boolean; currentUserId?: string; isMember?: boolean }) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [completion, setCompletion] = useState<CompletionSummary | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(API_MODE)

  useEffect(() => {
    if (!API_MODE) return
    let active = true
    Promise.all([
      apiRequest<{ data: ProgressSummary }>(`/projects/${projectId}/progress`, { requireAuthentication: true }),
      apiRequest<{ data: ActivityRecord[] }>(`/projects/${projectId}/activity?limit=8`, { requireAuthentication: true }),
      apiRequest<{ data: CompletionSummary }>(`/projects/${projectId}/completion`, { requireAuthentication: true }).catch((error: unknown) => {
        if (error instanceof ApiClientError && error.status === 404) return null
        throw error
      }),
    ]).then(([progressResponse, activityResponse, completionResponse]) => {
      if (!active) return
      setProgress(progressResponse.data); setActivity(activityResponse.data); setCompletion(completionResponse?.data ?? null); setMessage('')
    }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load project progress.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [projectId])

  const submitCompletion = async () => {
    try {
      await submitProjectCompletion(projectId)
      const response = await apiRequest<{ data: CompletionSummary }>(`/projects/${projectId}/completion`, { requireAuthentication: true })
      setCompletion(response.data); setMessage('Completion submitted for team confirmation.')
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit completion.') }
  }
  const confirmCompletion = async () => {
    try {
      await confirmProjectCompletion(projectId)
      const response = await apiRequest<{ data: CompletionSummary }>(`/projects/${projectId}/completion`, { requireAuthentication: true })
      setCompletion(response.data)
      setMessage(response.data.status === 'COMPLETED' ? 'Project completion confirmed. Contributions are recorded by the backend.' : 'Your confirmation was recorded.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to confirm completion.') }
  }
  const rejectCompletion = async () => {
    const reason = window.prompt('Why are you rejecting this completion?')
    if (!reason?.trim()) return
    try { await rejectProjectCompletion(projectId, reason.trim()); setCompletion({ status: 'REJECTED', teamSize: completion?.teamSize ?? 0, confirmations: [] }); setMessage('Completion rejected.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to reject completion.') }
  }

  if (!API_MODE) return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Project progress</h2><p className="mt-1 text-sm text-slate-500">Local demo mode is active. Backend progress, activity, and completion records are not being fabricated.</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Local demo mode</span></div><p className="mt-4 text-sm text-slate-600">Set <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_PROJECT_COLLABORATION_MODE=api</code> to use authenticated APIs. API failures remain visible and do not fall back silently.</p></section>

  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Project progress</h2><p className="mt-1 text-sm text-slate-500">Calculated from persisted task and milestone records.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">API mode</span></div>
    {loading && <p role="status" className="text-sm text-slate-500">Loading project progress…</p>}{message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    {progress && <><div><div className="flex justify-between text-sm font-semibold text-slate-700"><span>Overall completion</span><span>{progress.overallCompletionPercentage}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress.overallCompletionPercentage}%` }} /></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Tasks" value={`${progress.completedTasks}/${progress.totalTasks}`} /><Metric label="In progress" value={progress.inProgressTasks} /><Metric label="In review" value={progress.tasksInReview} /><Metric label="Overdue" value={progress.overdueTasks} /></div><p className="text-sm text-slate-500">Milestones: {progress.completedMilestones}/{progress.totalMilestones} complete · {progress.todoTasks} todo tasks.</p></>}
    {completion && <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Completion: {completion.status}</p><p className="mt-1 text-sm text-slate-500">{completion.confirmedMembers ?? (completion.confirmations ?? []).filter((item) => item.status === 'CONFIRMED').length} of {completion.teamSize} members confirmed.</p>{completion.status === 'PENDING_CONFIRMATION' && isMember && !(completion.confirmations ?? []).some((item) => item.userId === currentUserId && item.status === 'CONFIRMED') && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={confirmCompletion} className="min-h-10 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white">Confirm completion</button>{!canManage && <button type="button" onClick={rejectCompletion} className="min-h-10 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700">Reject</button>}</div>}</div>}
    {canManage && !completion && !loading && <button type="button" onClick={submitCompletion} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Submit for completion</button>}
    {activity.length > 0 && <div><h3 className="font-semibold text-slate-900">Recent activity</h3><ul className="mt-3 space-y-2">{activity.map((item) => <li key={item.activityId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{item.type.replaceAll('_', ' ')}</span><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></li>)}</ul></div>}
  </section>
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-lg font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div> }
